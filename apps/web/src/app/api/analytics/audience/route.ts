import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { getCachedInsight, setCachedInsight, canRegenerate } from "@/lib/insight-cache";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  }
  return _client;
}

// GET /api/analytics/audience — AI-estimated audience insights
export const GET = withErrorHandler(
  withRole("VIEWER", async (req) => {
    const url = new URL(req.url);
    const pageId = url.searchParams.get("pageId") || undefined;
    const forceRegenerate = url.searchParams.get("regenerate") === "true";

    // ── Cache-first: return cached if available ──────────────
    if (pageId && !forceRegenerate) {
      const cached = await getCachedInsight(pageId, "audience");
      if (cached && !cached.expired) {
        return NextResponse.json({
          ...cached.data as Record<string, unknown>,
          _cached: true,
          _generatedAt: cached.generatedAt.toISOString(),
        });
      }
    }

    // ── Rate limit regeneration ──────────────────────────────
    if (pageId && forceRegenerate) {
      const allowed = await canRegenerate(pageId, "audience");
      if (!allowed) {
        // Return stale cache instead
        const cached = await getCachedInsight(pageId, "audience");
        if (cached) {
          return NextResponse.json({
            ...cached.data as Record<string, unknown>,
            _cached: true,
            _generatedAt: cached.generatedAt.toISOString(),
            _rateLimited: true,
          });
        }
      }
    }

    // ── Generate fresh analysis ──────────────────────────────
    const posts = await prisma.post.findMany({
      where: { orgId: req.orgId, status: "PUBLISHED", ...(pageId ? { pageId } : {}) },
      select: {
        content: true,
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
            reach: true,
          },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    if (posts.length === 0) {
      return NextResponse.json({
        demographics: {
          ageGroups: [],
          genderSplit: [],
          locations: [],
        },
        activeHours: Array.from({ length: 24 }, (_, h) => ({ hour: h, activity: 0 })),
        interests: [],
        contentPreferences: [],
        persona: {
          name: "No data yet",
          description: "Publish some posts to get audience insights.",
          traits: [],
          platforms: [],
          contentLikes: [],
        },
      });
    }

    const postSummary = posts
      .slice(0, 30)
      .map((p) => {
        const snap = p.analytics[0];
        const engagement = snap ? snap.likes + snap.comments + snap.shares : 0;
        return `Platform: ${p.platform}, Content: "${p.content.slice(0, 150)}", Engagement: ${engagement}, Reach: ${snap?.reach ?? 0}`;
      })
      .join("\n");

    const platforms = [...new Set(posts.map((p) => p.platform))].join(", ");

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Based on these social media posts, their platforms, content themes, and engagement patterns, estimate the audience demographics and preferences.

Platforms used: ${platforms}
Posts data:
${postSummary}

Return ONLY valid JSON (no markdown, no code fences):
{
  "demographics": {
    "ageGroups": [
      { "label": "18-24", "percentage": 25 },
      { "label": "25-34", "percentage": 35 },
      { "label": "35-44", "percentage": 20 },
      { "label": "45-54", "percentage": 12 },
      { "label": "55+", "percentage": 8 }
    ],
    "genderSplit": [
      { "label": "Male", "percentage": 45 },
      { "label": "Female", "percentage": 50 },
      { "label": "Other", "percentage": 5 }
    ],
    "locations": [
      { "label": "United States", "percentage": 40 },
      { "label": "location2", "percentage": 20 },
      { "label": "location3", "percentage": 15 },
      { "label": "location4", "percentage": 10 },
      { "label": "Other", "percentage": 15 }
    ]
  },
  "activeHours": [array of 24 objects with { "hour": 0-23, "activity": 0-100 }],
  "interests": ["interest1", "interest2", "interest3", "interest4", "interest5", "interest6", "interest7", "interest8"],
  "contentPreferences": [
    { "type": "Educational", "score": 85 },
    { "type": "Entertaining", "score": 70 },
    { "type": "Inspirational", "score": 60 },
    { "type": "Promotional", "score": 40 },
    { "type": "News/Updates", "score": 55 }
  ],
  "persona": {
    "name": "A catchy persona name (e.g., 'Tech-Savvy Millennial Professional')",
    "description": "2-3 sentence description of the ideal follower",
    "traits": ["trait1", "trait2", "trait3", "trait4"],
    "platforms": ["platform1", "platform2"],
    "contentLikes": ["content type they love 1", "content type 2", "content type 3"]
  }
}`,
        },
      ],
    });

    const text = response.content[0];
    if (text?.type !== "text") throw new Error("No text in AI response");

    const cleaned = text.text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const result = JSON.parse(cleaned);

    // ── Save to cache ────────────────────────────────────────
    if (pageId) {
      setCachedInsight(pageId, req.orgId, "audience", result).catch(() => {});
    }

    return NextResponse.json({
      ...result,
      _cached: false,
      _generatedAt: new Date().toISOString(),
    });
  })
);
