import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@/lib/db";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  return _client;
}

// POST /api/ai/sentiment-check — sentiment + vision analysis + improved version
export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const body = await req.json();
    const content = body.content as string | undefined;
    let imageUrl = body.imageUrl as string | undefined;
    const postId = body.postId as string | undefined;

    // If postId provided but no imageUrl, fetch image directly from DB
    if (postId && !imageUrl) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { mediaUrls: true },
      });
      if (post?.mediaUrls?.[0]) {
        imageUrl = post.mediaUrls[0];
      }
    }

    if ((!content || content.trim().length === 0) && !imageUrl) {
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

    // Build multimodal message
    const parts: Anthropic.Messages.ContentBlockParam[] = [];

    // Parse base64 image if provided
    let hasImage = false;
    if (imageUrl && imageUrl.length > 200) {
      try {
        const dataMatch = imageUrl.match(/^data:(image\/(jpeg|png|gif|webp));base64,(.+)$/);
        if (dataMatch) {
          parts.push({
            type: "image",
            source: {
              type: "base64",
              media_type: dataMatch[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: dataMatch[3]!,
            },
          });
          hasImage = true;
        }
      } catch (e) {
        console.error("[sentiment-check] Image parse error:", e);
      }
    }

    const textContent = content?.trim() ?? "";

    parts.push({
      type: "text",
      text: `You are analyzing a social media post for a marketing platform.

${hasImage ? "I've attached the IMAGE that will be posted. You can SEE it. Describe what you see and analyze the visual design, text on the image, colors, branding, and messaging." : ""}
${textContent ? `Caption text: "${textContent}"` : "No caption text provided."}

${hasImage ? `CRITICAL: Look at the actual image. Describe the visual content, any text visible on the image, the design style, colors, and brand elements. Your analysis and improved caption MUST reference what's actually shown in the image. Do NOT write generic marketing text.` : ""}

${!hasImage && textContent.length < 30 ? "This appears to be placeholder text for an image post. Score it very low and write a proper caption." : ""}

Return ONLY valid JSON (no markdown, no code fences):
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": 0-100,
  "imageDescription": "${hasImage ? "What you see in the image — design, text, colors, brand elements" : "no image provided"}",
  "suggestions": ["max 3 specific suggestions${hasImage ? " that reference the actual image content" : ""}"],
  "improvedVersion": "An improved caption${hasImage ? " that directly references and complements what's shown in the image" : ""} — engaging hook, CTA, relevant hashtags, emoji"
}`,
    });

    console.log(`[sentiment-check] hasImage=${hasImage}, textLength=${textContent.length}, imageDataLength=${imageUrl?.length ?? 0}`);

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: parts }],
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
