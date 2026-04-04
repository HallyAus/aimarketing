import { NextRequest, NextResponse } from "next/server";
import { callClaude, extractJSON } from "@/lib/ai";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  competitorContent: z.string().max(10000).optional().default(""),
  url: z.string().url().max(2000).optional(),
  platform: z.string().min(1).max(50),
  tone: z.string().max(100).optional(),
  includeHashtags: z.boolean().optional().default(true),
});

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  let { competitorContent } = parsed.data;
  const { url, platform, tone, includeHashtags } = parsed.data;

  // If URL provided, try to fetch content
  if (url && !competitorContent) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "AdPilot/1.0 (Content Analyzer)" },
        signal: AbortSignal.timeout(10000),
      });
      const html = await res.text();
      // Basic HTML text extraction
      competitorContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 5000);
    } catch {
      return NextResponse.json({ error: "Failed to fetch URL content" }, { status: 400 });
    }
  }

  if (!competitorContent) {
    return NextResponse.json({ error: "Provide competitor content or a valid URL" }, { status: 400 });
  }

  // Load business profile for brand context
  let brandContext = "";
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.orgId },
      select: { name: true, metadata: true },
    });
    const meta = org?.metadata as Record<string, unknown> | null;
    if (meta?.businessProfile) {
      const bp = meta.businessProfile as Record<string, unknown>;
      const parts: string[] = [];
      if (org?.name) parts.push(`Our brand: ${org.name}`);
      if (bp.industry) parts.push(`Industry: ${bp.industry}`);
      if (bp.targetAudience) parts.push(`Our target audience: ${bp.targetAudience}`);
      if (bp.brandKeywords) parts.push(`Brand keywords: ${bp.brandKeywords}`);
      brandContext = parts.join(". ");
    }
  } catch { /* non-critical */ }

  const response = await callClaude({
    feature: "competitor_match",
    messages: [{
      role: "user",
      content: `Analyze this competitor's ${platform.replace("_", " ")} post and create an ORIGINAL post targeting the same audience but with a completely different approach. This is NOT about copying — it's about understanding their targeting strategy.

COMPETITOR POST:
${competitorContent}

${brandContext ? `OUR BRAND CONTEXT: ${brandContext}` : ""}
${tone ? `DESIRED TONE: ${tone}` : ""}

Return ONLY valid JSON (no markdown, no code fences):
{
  "analysis": {
    "targetAudience": "description of who this targets",
    "sentiment": "overall emotional tone",
    "keyMessages": ["message 1", "message 2", "message 3"],
    "cta": "call-to-action strategy description",
    "hooks": ["engagement hook 1", "engagement hook 2", "engagement hook 3"]
  },
  "yourVersion": {
    "content": "Your ORIGINAL ${platform.replace("_", " ")} post targeting the same audience${includeHashtags ? " with hashtags" : " without hashtags"}. Ready to post as-is.",
    "hashtags": ${includeHashtags ? '["#tag1", "#tag2", "#tag3"]' : "[]"},
    "suggestedTime": "best time to post for this audience"
  }
}`,
    }],
  });

  const result = extractJSON(response);
  return NextResponse.json(result);
}));
