import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { getContentMemory } from "@/lib/content-memory";
import { z } from "zod";

const carouselSchema = z.object({
  topic: z.string().min(1).max(2000),
  platform: z.enum(["instagram", "linkedin"]),
  numSlides: z.number().int().min(3).max(10),
  content: z.string().max(10000).optional(),
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
  const parsed = carouselSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { topic, platform, numSlides, content } = parsed.data;

  const platformName = platform === "instagram" ? "Instagram" : "LinkedIn";

  const contentMemory = await getContentMemory(req.orgId);

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Create a ${numSlides}-slide ${platformName} carousel about: ${topic}

${content ? `Additional context/content to use:\n${content.slice(0, 5000)}` : ""}

Requirements:
- Slide 1: Hook/attention-grabbing title slide
- Middle slides: One key point per slide, concise and visual-friendly
- Last slide: Strong call-to-action
- Each slide should have a clear title and body text
- Text should be short enough to read on a carousel slide
- Include an image prompt for each slide (description for AI image generation)

Respond ONLY with valid JSON in this exact format, no other text:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Attention-grabbing title",
      "body": "Supporting text for the slide",
      "cta": "Call to action text (only for last slide, null otherwise)",
      "imagePrompt": "Description for generating a background image"
    }
  ]
}

Make it engaging, educational, and optimized for ${platformName} carousel format.${contentMemory}`,
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
    return NextResponse.json({ slides: data.slides });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}));
