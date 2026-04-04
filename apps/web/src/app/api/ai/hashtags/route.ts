import { NextRequest, NextResponse } from "next/server";
import { callClaude, extractJSON } from "@/lib/ai";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { z } from "zod";

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

    const response = await callClaude({
      feature: "hashtag_suggestion",
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

    const result = extractJSON(response);
    return NextResponse.json(result);
  })
);
