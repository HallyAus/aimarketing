import { NextResponse } from "next/server";
import { callClaude, extractText } from "@/lib/ai";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { getCachedInsight, setCachedInsight, canRegenerate } from "@/lib/insight-cache";
import { z } from "zod";

const singleSchema = z.object({
  url: z.string().min(1).max(2000),
  compareSummary: z.literal(false).or(z.undefined()).optional(),
});

const summarySchema = z.object({
  compareSummary: z.literal(true),
  competitors: z.array(
    z.object({
      url: z.string(),
      analysis: z.any(),
    })
  ),
});

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(normalizedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AdPilot/1.0; Content Analysis Bot)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return `Could not fetch URL (status ${res.status}). Analyzing based on the URL/handle provided.`;
    const html = await res.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 8000);
  } catch {
    return `Could not fetch URL content. Analyzing based on the URL/handle provided: ${url}`;
  }
}

export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const reqUrl = new URL(req.url);
    const pageId = reqUrl.searchParams.get("pageId") || undefined;
    const forceRegenerate = reqUrl.searchParams.get("regenerate") === "true";

    const body = await req.json();

    // Check if this is a compare summary request
    const summaryParsed = summarySchema.safeParse(body);
    if (summaryParsed.success) {
      const { competitors } = summaryParsed.data;
      const competitorSummaries = competitors
        .map((c) => `Competitor: ${c.url}\n${JSON.stringify(c.analysis, null, 2)}`)
        .join("\n\n---\n\n");

      const response = await callClaude({
        feature: "analytics_benchmarking",
        messages: [
          {
            role: "user",
            content: `Compare these competitors and provide a strategic analysis.

${competitorSummaries}

Return ONLY valid JSON (no markdown, no code fences):
{
  "summary": "2-3 paragraph competitive landscape summary",
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3", "actionable recommendation 4", "actionable recommendation 5"]
}`,
          },
        ],
      });

      const text = extractText(response);
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const summary = JSON.parse(cleaned);
      return NextResponse.json({ summary });
    }

    // ── Cache-first: return cached if available ──────────────
    if (pageId && !forceRegenerate) {
      const cached = await getCachedInsight(pageId, "benchmarking");
      if (cached && !cached.expired) {
        return NextResponse.json({
          ...(cached.data as Record<string, unknown>),
          _cached: true,
          _generatedAt: cached.generatedAt.toISOString(),
        });
      }
    }

    // ── Rate limit regeneration ──────────────────────────────
    if (pageId && forceRegenerate) {
      const allowed = await canRegenerate(pageId, "benchmarking");
      if (!allowed) {
        const cached = await getCachedInsight(pageId, "benchmarking");
        if (cached) {
          return NextResponse.json({
            ...(cached.data as Record<string, unknown>),
            _cached: true,
            _generatedAt: cached.generatedAt.toISOString(),
            _rateLimited: true,
          });
        }
      }
    }

    // Single competitor analysis
    const parsed = singleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const { url } = parsed.data;
    const content = await fetchUrlContent(url);

    const response = await callClaude({
      feature: "analytics_benchmarking",
      messages: [
        {
          role: "user",
          content: `Analyze this competitor's online presence and content strategy.

Competitor URL/handle: ${url}
Content from their page:
${content}

Return ONLY valid JSON (no markdown, no code fences):
{
  "contentThemes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "postingFrequency": "estimated posting frequency description",
  "toneAnalysis": "description of their brand tone and voice",
  "topContentTypes": ["type1", "type2", "type3"],
  "engagementStrategies": ["strategy1", "strategy2", "strategy3"],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"]
}`,
        },
      ],
    });

    const text = extractText(response);
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const analysis = JSON.parse(cleaned);

    const result = { analysis };

    // ── Save to cache ────────────────────────────────────────
    if (pageId) setCachedInsight(pageId, req.orgId, "benchmarking", result).catch(() => {});

    return NextResponse.json({
      ...result,
      _cached: false,
      _generatedAt: new Date().toISOString(),
    });
  })
);
