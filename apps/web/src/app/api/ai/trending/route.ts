import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { getCachedInsight, setCachedInsight, canRegenerate } from "@/lib/insight-cache";
import { z } from "zod";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  }
  return _client;
}

const schema = z.object({
  niche: z.string().min(1, "Industry/niche is required").max(500),
  pageId: z.string().optional(),
  forceRegenerate: z.boolean().optional().default(false),
});

// POST /api/ai/trending — generate trending topics for a niche
export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const { niche, pageId, forceRegenerate } = parsed.data;

    // ── Cache-first: return cached if available ──────────────
    if (pageId && !forceRegenerate) {
      const cached = await getCachedInsight(pageId, "trending");
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
      const allowed = await canRegenerate(pageId, "trending");
      if (!allowed) {
        const cached = await getCachedInsight(pageId, "trending");
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

    // ── Generate fresh topics ────────────────────────────────
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are a social media trends expert. Generate 8 currently trending topics for the "${niche}" industry as of ${today}. These should be realistic, timely topics that a social media manager would want to create content about.

For each topic provide:
- A catchy title
- Brief description of why it's trending
- Relevance level (High/Medium)
- A specific content angle a brand could use
- 3-4 relevant hashtags

Return ONLY valid JSON (no markdown, no code fences):
{
  "topics": [
    {
      "title": "Topic Title",
      "description": "Why this is trending right now",
      "relevance": "High",
      "suggestedAngle": "How a brand in this niche should approach this topic",
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
    }
  ]
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
      setCachedInsight(pageId, req.orgId, "trending", result).catch(() => {});
    }

    return NextResponse.json({
      ...result,
      _cached: false,
      _generatedAt: new Date().toISOString(),
    });
  })
);
