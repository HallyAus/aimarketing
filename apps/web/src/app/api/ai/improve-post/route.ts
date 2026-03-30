import { NextRequest, NextResponse } from "next/server";
import { improvePostContent } from "@/lib/ai";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { z } from "zod";

const improvePostSchema = z.object({
  content: z.string().min(1).max(5000),
  platform: z.string().min(1).max(50),
  instruction: z.string().max(1000).optional(),
});

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = improvePostSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const improved = await improvePostContent(parsed.data);

  return NextResponse.json({ content: improved });
}));
