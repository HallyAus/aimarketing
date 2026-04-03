import { NextRequest, NextResponse } from "next/server";
import { generateCampaignIdeas } from "@/lib/ai";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { withAiUsageTracking } from "@/lib/usage-limits";
import { z } from "zod";

const generateIdeasSchema = z.object({
  industry: z.string().min(1).max(200),
  objective: z.string().min(1).max(200),
  platforms: z.array(z.string().max(50)).max(10).optional(),
  count: z.number().int().min(1).max(20).optional(),
});

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = generateIdeasSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const ideas = await withAiUsageTracking(req.orgId, () =>
    generateCampaignIdeas({
      industry: parsed.data.industry,
      objective: parsed.data.objective,
      platforms: parsed.data.platforms ?? ["FACEBOOK", "INSTAGRAM"],
      count: parsed.data.count,
    })
  );

  return NextResponse.json({ ideas });
}));
