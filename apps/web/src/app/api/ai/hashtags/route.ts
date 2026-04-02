import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { z } from "zod";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  }
  return _client;
}

const hashtagSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(500),
  platform: z.enum(["instagram", "twitter", "linkedin", "tiktok"]),
});

export const POST = withErrorHandler(
  withRole("EDITOR", async (req: NextRequest) => {
    const body = await req.json();
    const parsed = hashtagSchema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(
        parsed.error.issues.map((i) => i.message).join(", ")
      );
    }

    const { topic, platform } = parsed.data;

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Generate hashtag research for the topic "${topic}" on ${platform}. Return ONLY valid JSON (no markdown, no code fences).

Consider ${platform}-specific best practices:
- Instagram: up to 30 hashtags, mix of popular and niche
- Twitter: 2-5 hashtags max, trending focus
- LinkedIn: 3-5 professional hashtags
- TikTok: trending sounds/challenges related hashtags

Return this exact JSON structure:
{
  "trending": [
    { "tag": "#hashtag", "estimatedReach": "500K-1M", "competition": "high" }
  ],
  "niche": [
    { "tag": "#hashtag", "estimatedReach": "10K-50K", "competition": "low" }
  ],
  "branded": [
    { "tag": "#hashtag", "description": "why this branded hashtag works" }
  ],
  "groups": [
    {
      "name": "Group Name",
      "description": "when to use this group",
      "hashtags": ["#tag1", "#tag2", "#tag3"]
    }
  ]
}

Generate 8-10 trending, 8-10 niche, 3-5 branded suggestions, and 3-4 ready-to-use groups.`,
        },
      ],
    });

    const text = response.content[0];
    if (text?.type !== "text") {
      throw new Error("No text in AI response");
    }

    let result;
    try {
      const cleaned = text.text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      result = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse hashtag research from AI response");
    }

    return NextResponse.json(result);
  })
);
