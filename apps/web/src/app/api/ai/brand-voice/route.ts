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

const brandVoiceSchema = z.object({
  samples: z
    .array(z.string().min(1).max(10000))
    .min(1, "Provide at least one content sample")
    .max(20, "Maximum 20 samples"),
});

export const POST = withErrorHandler(
  withRole("EDITOR", async (req: NextRequest) => {
    const body = await req.json();
    const parsed = brandVoiceSchema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(
        parsed.error.issues.map((i) => i.message).join(", ")
      );
    }

    const { samples } = parsed.data;
    const samplesText = samples
      .map((s, i) => `--- Sample ${i + 1} ---\n${s}`)
      .join("\n\n");

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Analyze these content samples and create a brand voice profile. Return ONLY valid JSON (no markdown, no code fences).

${samplesText}

Return this exact JSON structure:
{
  "tone": "one-sentence description of overall tone",
  "vocabulary": ["word1", "word2", "word3", "word4", "word5", "word6", "word7", "word8"],
  "sentenceStyle": "description of typical sentence structure and length",
  "doList": ["do item 1", "do item 2", "do item 3", "do item 4", "do item 5"],
  "dontList": ["don't item 1", "don't item 2", "don't item 3", "don't item 4", "don't item 5"],
  "systemPrompt": "A ready-to-use system prompt that captures this brand voice for AI content generation. Should be 2-3 sentences."
}`,
        },
      ],
    });

    const text = response.content[0];
    if (text?.type !== "text") {
      throw new Error("No text in AI response");
    }

    let profile;
    try {
      const cleaned = text.text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      profile = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse brand voice profile from AI response");
    }

    return NextResponse.json({ profile });
  })
);
