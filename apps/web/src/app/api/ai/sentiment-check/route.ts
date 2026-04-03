import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  return _client;
}

// POST /api/ai/sentiment-check — sentiment + image analysis + improved version
export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const { content, imageUrl } = await req.json();

    if ((!content || typeof content !== "string" || content.trim().length === 0) && !imageUrl) {
      return NextResponse.json(
        { error: "content or imageUrl is required", code: "VALIDATION_ERROR", statusCode: 400 },
        { status: 400 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured", code: "CONFIG_ERROR", statusCode: 503 },
        { status: 503 },
      );
    }

    // Build message content — text + optional image
    const messageContent: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    // Add image if provided (base64 data URL)
    if (imageUrl && typeof imageUrl === "string" && imageUrl.startsWith("data:image/")) {
      const match = imageUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (match) {
        messageContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: match[2]!,
          },
        });
      }
    }

    const hasImage = messageContent.length > 0;
    const textContent = content?.trim() ?? "";

    messageContent.push({
      type: "text",
      text: `Analyze this social media post and write an improved version.

${hasImage ? "I've attached the image that will be posted." : ""}
${textContent ? `Caption/text: "${textContent}"` : "No caption provided."}

${hasImage ? `IMPORTANT: You can SEE the attached image. Analyze what's in the image — the design, colors, text on the image, messaging, brand elements. Use what you see to:
- Score how effective the IMAGE + caption combination is as a social media post
- Write suggestions that reference the actual image content
- Write an improved caption that complements what's shown in the image` : ""}

${!hasImage && textContent.length < 30 ? `The text appears to be a placeholder. Score it low and write a real caption.` : ""}

Return ONLY valid JSON (no markdown, no code fences):
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": 0-100,
  "imageDescription": "${hasImage ? "Brief description of what you see in the image" : ""}",
  "suggestions": ["max 3 specific actionable suggestions${hasImage ? " referencing the image content" : ""}"],
  "improvedVersion": "An improved caption${hasImage ? " that complements the image" : ""} — engaging hooks, CTA, hashtags, emoji. ${hasImage ? "Reference what's actually in the image." : ""}"
}`,
    });

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: messageContent }],
    });

    const text = response.content[0];
    if (text?.type !== "text") throw new Error("No text in AI response");

    const cleaned = text.text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json({
      sentiment: result.sentiment ?? "neutral",
      score: typeof result.score === "number" ? result.score : 50,
      imageDescription: result.imageDescription ?? "",
      suggestions: Array.isArray(result.suggestions) ? result.suggestions.slice(0, 3) : [],
      improvedVersion: typeof result.improvedVersion === "string" ? result.improvedVersion : "",
    });
  }),
);
