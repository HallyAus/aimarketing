import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { z } from "zod";

const storyTemplateSchema = z.object({
  category: z.string().min(1).max(100),
  topic: z.string().min(1).max(2000),
  platform: z.string().min(1).max(50),
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
  const parsed = storyTemplateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { category, topic, platform } = parsed.data;

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Create content for a ${platform} Story/Reel using the "${category}" template.

Topic/Product details: ${topic}

Generate content appropriate for a short-form vertical video or story format.

Respond ONLY with valid JSON in this exact format, no other text:
{
  "textOverlay": "The main text that appears on screen (keep it short, 2-3 lines max)",
  "caption": "The caption/description that goes below the story/reel",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "musicSuggestion": "Suggested music genre or specific trending sound that fits the content",
  "tips": ["Filming tip 1", "Filming tip 2", "Editing tip 3"]
}

Make the content:
- Attention-grabbing in the first 1-2 seconds
- Appropriate for the "${category}" template style
- Optimized for ${platform}
- Trendy and engaging for short-form content
- Include actionable filming/editing tips`,
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
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}));
