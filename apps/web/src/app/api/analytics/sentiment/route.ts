import { NextResponse } from "next/server";
import { callClaude, extractText } from "@/lib/ai";
import { withErrorHandler } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { getCachedInsight, setCachedInsight, canRegenerate } from "@/lib/insight-cache";

// GET /api/analytics/sentiment — analyze sentiment of org posts
export const GET = withErrorHandler(
  withRole("VIEWER", async (req) => {
    const url = new URL(req.url);
    const pageId = url.searchParams.get("pageId") || undefined;
    const forceRegenerate = url.searchParams.get("regenerate") === "true";

    // ── Cache-first: return cached if available ──────────────
    if (pageId && !forceRegenerate) {
      const cached = await getCachedInsight(pageId, "sentiment");
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
      const allowed = await canRegenerate(pageId, "sentiment");
      if (!allowed) {
        // Return stale cache instead
        const cached = await getCachedInsight(pageId, "sentiment");
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
      where: { orgId: req.orgId, ...(pageId ? { pageId } : {}) },
      select: {
        id: true,
        content: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    if (posts.length === 0) {
      return NextResponse.json({
        positive: 0,
        neutral: 0,
        negative: 0,
        trend: [],
        recommendations: [],
        postBreakdown: [],
      });
    }

    const postSummary = posts
      .slice(0, 50)
      .map((p, i) => `Post ${i + 1} (ID: ${p.id}): ${p.content.slice(0, 200)}`)
      .join("\n");

    const response = await callClaude({
      feature: "analytics_sentiment",
      messages: [
        {
          role: "user",
          content: `Analyze the sentiment of each of these social media posts. Classify each as "positive", "neutral", or "negative" and assign a confidence score 0-100.

${postSummary}

Return ONLY valid JSON (no markdown, no code fences):
{
  "posts": [
    { "id": "post_id", "sentiment": "positive|neutral|negative", "score": 85 }
  ],
  "recommendations": [
    "Specific actionable recommendation to improve content sentiment"
  ]
}`,
        },
      ],
    });

    const text = extractText(response);

    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const aiResult = JSON.parse(cleaned);

    let positive = 0;
    let neutral = 0;
    let negative = 0;
    const postBreakdown: { id: string; content: string; sentiment: string; score: number }[] = [];

    for (const aiPost of aiResult.posts || []) {
      const originalPost = posts.find((p) => p.id === aiPost.id);
      if (!originalPost) continue;

      if (aiPost.sentiment === "positive") positive++;
      else if (aiPost.sentiment === "negative") negative++;
      else neutral++;

      postBreakdown.push({
        id: aiPost.id,
        content: originalPost.content,
        sentiment: aiPost.sentiment,
        score: aiPost.score,
      });
    }

    const weekMap = new Map<string, { positive: number; neutral: number; negative: number }>();
    for (const aiPost of aiResult.posts || []) {
      const originalPost = posts.find((p) => p.id === aiPost.id);
      if (!originalPost) continue;
      const date = originalPost.publishedAt ?? originalPost.createdAt;
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split("T")[0] ?? "";

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { positive: 0, neutral: 0, negative: 0 });
      }
      const week = weekMap.get(weekKey)!;
      if (aiPost.sentiment === "positive") week.positive++;
      else if (aiPost.sentiment === "negative") week.negative++;
      else week.neutral++;
    }

    const trend = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    const result = {
      positive,
      neutral,
      negative,
      trend,
      recommendations: aiResult.recommendations || [],
      postBreakdown: postBreakdown.slice(0, 30),
    };

    // ── Save to cache ────────────────────────────────────────
    if (pageId) {
      setCachedInsight(pageId, req.orgId, "sentiment", result).catch(() => {});
    }

    return NextResponse.json({
      ...result,
      _cached: false,
      _generatedAt: new Date().toISOString(),
    });
  })
);
