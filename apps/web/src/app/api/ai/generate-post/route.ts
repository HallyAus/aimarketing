import { NextRequest, NextResponse } from "next/server";
import { generatePostContent } from "@/lib/ai";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";
import { withAiUsageTracking } from "@/lib/usage-limits";
import { z } from "zod";

const generatePostSchema = z.object({
  platform: z.string().min(1).max(50),
  topic: z.string().max(500).optional().default(""),
  tone: z.string().max(100).optional(),
  style: z.string().max(100).optional(),
  includeHashtags: z.boolean().optional(),
  includeEmojis: z.boolean().optional(),
  customPrompt: z.string().max(5000).optional(),
  brandVoiceId: z.string().max(100).optional(),
});

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = generatePostSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { customPrompt, brandVoiceId, ...rest } = parsed.data;

  // Load brand voice if specified
  let brandVoicePrompt: string | undefined;
  if (brandVoiceId) {
    const voice = await prisma.brandVoice.findUnique({ where: { id: brandVoiceId } });
    if (voice?.aiPrompt) {
      brandVoicePrompt = voice.aiPrompt;
    }
  }

  // Load business profile for additional context
  let businessContext: string | undefined;
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.orgId },
      select: { metadata: true },
    });
    const meta = org?.metadata as Record<string, unknown> | null;
    if (meta?.businessProfile) {
      const bp = meta.businessProfile as Record<string, unknown>;
      const parts: string[] = [];
      if (bp.businessName) parts.push(`Business: ${bp.businessName}`);
      if (bp.industry) parts.push(`Industry: ${bp.industry}`);
      if (bp.targetAudience) parts.push(`Target Audience: ${bp.targetAudience}`);
      if (bp.brandKeywords) parts.push(`Brand Keywords: ${bp.brandKeywords}`);
      if (parts.length) businessContext = parts.join(". ") + ".";
    }
  } catch { /* non-critical */ }

  const content = await withAiUsageTracking(req.orgId, () =>
    generatePostContent({
      ...rest,
      topic: rest.topic || customPrompt || "",
      customPrompt,
      brandVoicePrompt,
      businessContext,
    })
  );

  return NextResponse.json({ content });
}));
