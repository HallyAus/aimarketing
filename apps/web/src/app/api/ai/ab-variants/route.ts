import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { getContentMemory } from "@/lib/content-memory";
import { z } from "zod";

const abVariantsSchema = z.object({
  content: z.string().min(1).max(10000),
  platform: z.string().min(1).max(50),
  numVariants: z.number().int().min(2).max(5),
});

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    });
  }
  return _client;
}

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = abVariantsSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { content, platform, numVariants } = parsed.data;

  const platformName = platform.replace(/_/g, " ");

  const contentMemory = await getContentMemory(req.orgId);

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Create ${numVariants} A/B test variants of this ${platformName} post. Each variant should use a different strategy to maximize engagement.

Original post:
${content}

For each variant, use a DIFFERENT strategy from this list:
- Different hook/opening line
- Different call-to-action
- Different tone (more casual, more urgent, more emotional, etc.)
- Different length (shorter/longer)
- Different emoji usage
- Different hashtag strategy
- Question-based opening
- Story-based approach
- Statistics/data-led approach
- Social proof approach

Respond ONLY with valid JSON in this exact format, no other text:
{
  "variants": [
    {
      "content": "The full variant post content ready to publish...",
      "strategy": "Brief name of the strategy used",
      "changes": ["Specific change 1", "Specific change 2"]
    }
  ]
}

Ensure each variant is meaningfully different and optimized for ${platformName}. All variants should be ready to post as-is.${contentMemory}`,
      },
    ],
  });

  const text = response.content[0];
  if (text?.type !== "text") {
    return NextResponse.json({ error: "No response from AI" }, { status: 500 });
  }

  try {
    const jsonMatch = text.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ variants: data.variants });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}));
