import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  return _client;
}

// POST /api/ai/sentiment-check — lightweight single-post sentiment analysis
export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "content is required", code: "VALIDATION_ERROR", statusCode: 400 },
        { status: 400 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured", code: "CONFIG_ERROR", statusCode: 503 },
        { status: 503 },
      );
    }

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze the sentiment and effectiveness of this social media post. Be concise.

Post: "${content}"

Return ONLY valid JSON (no markdown, no code fences):
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": 0-100,
  "suggestions": ["max 3 short actionable suggestions to improve the post's tone and engagement"]
}`,
        },
      ],
    });

    const text = response.content[0];
    if (text?.type !== "text") throw new Error("No text in AI response");

    const cleaned = text.text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json({
      sentiment: result.sentiment ?? "neutral",
      score: typeof result.score === "number" ? result.score : 50,
      suggestions: Array.isArray(result.suggestions) ? result.suggestions.slice(0, 3) : [],
    });
  }),
);
