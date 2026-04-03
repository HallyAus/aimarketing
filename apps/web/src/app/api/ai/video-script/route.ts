import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { getContentMemory } from "@/lib/content-memory";
import { z } from "zod";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  }
  return _client;
}

const videoScriptSchema = z.object({
  topic: z.string().min(1, "Topic is required").max(2000),
  platform: z.enum(["tiktok", "instagram-reels", "youtube-shorts", "youtube"]),
  duration: z.enum(["15s", "30s", "60s", "3min", "10min"]),
  style: z.enum([
    "tutorial",
    "behind-the-scenes",
    "product-demo",
    "storytelling",
    "educational",
  ]),
});

const durationGuide: Record<string, string> = {
  "15s": "15 seconds (approximately 40 words)",
  "30s": "30 seconds (approximately 80 words)",
  "60s": "60 seconds (approximately 160 words)",
  "3min": "3 minutes (approximately 450 words)",
  "10min": "10 minutes (approximately 1500 words)",
};

export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const body = await req.json();
    const parsed = videoScriptSchema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(
        parsed.error.issues.map((i) => i.message).join(", ")
      );
    }

    const { topic, platform, duration, style } = parsed.data;

    const contentMemory = await getContentMemory(req.orgId);

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Generate a complete video script for ${platform.replace("-", " ")}. Return ONLY valid JSON (no markdown, no code fences).

Topic: ${topic}
Duration: ${durationGuide[duration]}
Style: ${style}
Platform: ${platform.replace("-", " ")}

Platform considerations:
- TikTok: Hook in first 1-2 seconds, fast-paced, trending audio friendly
- Instagram Reels: Visual-first, strong hook, use text overlays
- YouTube Shorts: Similar to TikTok but can be slightly more polished
- YouTube: Proper intro, chapters, subscribe CTA, end screen

Return this exact JSON structure:
{
  "hook": "The first 3 seconds hook text - this is critical for retention",
  "body": "The main body of the script with clear scene/shot descriptions in brackets like [SHOT: close-up of product]. Include natural transitions.",
  "cta": "The call-to-action at the end",
  "onScreenText": ["text overlay 1", "text overlay 2", "text overlay 3", "text overlay 4"],
  "musicMood": "Description of the ideal background music mood and tempo",
  "fullScript": "The complete script as it would be read/performed, with timing markers like [0:00-0:03] for each section",
  "tips": ["production tip 1", "production tip 2", "production tip 3"]
}${contentMemory}`,
        },
      ],
    });

    const text = response.content[0];
    if (text?.type !== "text") {
      throw new Error("No text in AI response");
    }

    let script;
    try {
      const cleaned = text.text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      script = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse video script from AI response");
    }

    return NextResponse.json({ script });
  })
);
