import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  }
  return _client;
}

// GET /api/analytics/best-times — analyze best posting times
export const GET = withErrorHandler(
  withRole("VIEWER", async (req) => {
    const url = new URL(req.url);
    const pageId = url.searchParams.get("pageId") || undefined;

    // Get published posts with engagement data
    const posts = await prisma.post.findMany({
      where: {
        orgId: req.orgId,
        status: "PUBLISHED",
        publishedAt: { not: null },
        ...(pageId ? { pageId } : {}),
      },
      select: {
        id: true,
        platform: true,
        publishedAt: true,
        analytics: {
          orderBy: { snapshotAt: "desc" },
          take: 1,
          select: {
            impressions: true,
            likes: true,
            comments: true,
            shares: true,
            saves: true,
          },
        },
      },
      take: 500,
    });

    // Build heatmap from actual post data
    const dayHourScores: Record<string, { total: number; count: number }> = {};
    const platformData: Record<string, { day: number; hour: number; engagement: number }[]> = {};

    for (const post of posts) {
      if (!post.publishedAt) continue;
      const date = new Date(post.publishedAt);
      // Convert to 0=Mon through 6=Sun
      const jsDay = date.getUTCDay();
      const day = jsDay === 0 ? 6 : jsDay - 1;
      const hour = date.getUTCHours();
      const key = `${day}-${hour}`;

      const snap = post.analytics[0];
      const engagement = snap
        ? snap.likes + snap.comments + snap.shares + snap.saves
        : 0;

      if (!dayHourScores[key]) dayHourScores[key] = { total: 0, count: 0 };
      dayHourScores[key]!.total += engagement;
      dayHourScores[key]!.count += 1;

      if (!platformData[post.platform]) platformData[post.platform] = [];
      platformData[post.platform]!.push({ day, hour, engagement });
    }

    // Compute heatmap scores normalized 0-100
    const avgScores = Object.entries(dayHourScores).map(([key, val]) => ({
      key,
      avg: val.count > 0 ? val.total / val.count : 0,
    }));
    const maxAvg = Math.max(...avgScores.map((s) => s.avg), 1);

    const heatmap: { day: number; hour: number; score: number }[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        const found = avgScores.find((s) => s.key === key);
        heatmap.push({
          day,
          hour,
          score: found ? Math.round((found.avg / maxAvg) * 100) : 0,
        });
      }
    }

    // Generate AI platform recommendations
    const platformSummary = Object.entries(platformData)
      .map(([platform, data]) => {
        const byDay: Record<number, number[]> = {};
        const byHour: Record<number, number[]> = {};
        for (const d of data) {
          if (!byDay[d.day]) byDay[d.day] = [];
          byDay[d.day]!.push(d.engagement);
          if (!byHour[d.hour]) byHour[d.hour] = [];
          byHour[d.hour]!.push(d.engagement);
        }
        return `Platform: ${platform}, Posts: ${data.length}, Avg engagements by day: ${JSON.stringify(
          Object.fromEntries(
            Object.entries(byDay).map(([k, v]) => [k, Math.round(v.reduce((a, b) => a + b, 0) / v.length)])
          )
        )}, Avg engagements by hour: ${JSON.stringify(
          Object.fromEntries(
            Object.entries(byHour).map(([k, v]) => [k, Math.round(v.reduce((a, b) => a + b, 0) / v.length)])
          )
        )}`;
      })
      .join("\n");

    let platformRecommendations: { platform: string; bestTimes: string[]; bestDays: string[]; reasoning: string }[] = [];

    if (posts.length > 0 && platformSummary.length > 0) {
      try {
        const response = await getClient().messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: `Based on this posting performance data, recommend the best times to post for each platform.

${platformSummary}

Days: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
Hours: 0-23 (UTC)

Return ONLY valid JSON (no markdown, no code fences):
{
  "recommendations": [
    {
      "platform": "PLATFORM_NAME",
      "bestTimes": ["9:00 AM", "1:00 PM", "6:00 PM"],
      "bestDays": ["Tuesday", "Thursday", "Saturday"],
      "reasoning": "Brief explanation of why these times work best"
    }
  ]
}`,
            },
          ],
        });

        const text = response.content[0];
        if (text?.type === "text") {
          const cleaned = text.text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          const parsed = JSON.parse(cleaned);
          platformRecommendations = parsed.recommendations || [];
        }
      } catch {
        // If AI fails, return heatmap without recommendations
      }
    }

    return NextResponse.json({ heatmap, platformRecommendations });
  })
);

// POST /api/analytics/best-times — toggle auto-optimize
export const POST = withErrorHandler(
  withRole("EDITOR", async (req: NextRequest) => {
    const { autoOptimize } = await req.json();
    // Store auto-optimize preference (in org metadata or a setting)
    // For now, just acknowledge
    return NextResponse.json({ autoOptimize: !!autoOptimize, success: true });
  })
);
