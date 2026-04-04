import { NextRequest, NextResponse } from "next/server";
import { callClaude, extractJSON } from "@/lib/ai";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { z } from "zod";

const competitorSchema = z.object({
  url: z.string().min(1, "URL or handle is required").max(2000),
  generateCounter: z.boolean().optional().default(false),
});

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ReachPilot/1.0; Content Analysis Bot)",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return `Could not fetch URL (status ${res.status}). Analyzing based on the URL/handle provided.`;
    const html = await res.text();
    // Strip HTML tags, keep text content
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
  withRole("EDITOR", async (req: NextRequest) => {
    const body = await req.json();
    const parsed = competitorSchema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(
        parsed.error.issues.map((i) => i.message).join(", ")
      );
    }

    const { url, generateCounter } = parsed.data;
    const content = await fetchUrlContent(url);

    const prompt = generateCounter
      ? `Based on this competitor analysis, generate 3 counter-content posts that would compete effectively. For each post, specify the platform, content, and strategy.

Competitor URL/handle: ${url}
Content from their page:
${content}

Return ONLY valid JSON (no markdown, no code fences):
{
  "counterPosts": [
    { "platform": "string", "content": "string", "strategy": "string" }
  ]
}`
      : `Analyze this competitor's online presence and content strategy.

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
}`;

    const response = await callClaude({
      feature: "competitor_analysis",
      messages: [{ role: "user", content: prompt }],
    });

    const analysis = extractJSON(response);
    return NextResponse.json({ analysis });
  })
);
