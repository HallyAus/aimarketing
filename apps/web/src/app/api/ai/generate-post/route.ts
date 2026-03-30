import { NextRequest, NextResponse } from "next/server";
import { generatePostContent } from "@/lib/ai";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { z } from "zod";

const generatePostSchema = z.object({
  platform: z.string().min(1).max(50),
  topic: z.string().min(1).max(500),
  tone: z.string().max(100).optional(),
  style: z.string().max(100).optional(),
  includeHashtags: z.boolean().optional(),
  includeEmojis: z.boolean().optional(),
});

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = generatePostSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const content = await generatePostContent(parsed.data);

  return NextResponse.json({ content });
}));
