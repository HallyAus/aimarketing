import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { z } from "zod";

const PLATFORM_NAMES: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  TWITTER_X: "Twitter/X",
};

const urlToPostsSchema = z.object({
  url: z.string().url().max(2048),
  platformIds: z.array(z.string().min(1).max(50)).min(1).max(10),
  postsPerPlatform: z.number().int().min(1).max(10),
  tone: z.string().max(100).optional(),
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

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = urlToPostsSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { url, platformIds, postsPerPlatform, tone = "professional" } = parsed.data;

  // Fetch and extract text from the URL
  let pageText: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AdPilot/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${res.status}` }, { status: 400 });
    }
    const html = await res.text();
    pageText = stripHtml(html).slice(0, 5000);
  } catch {
    return NextResponse.json({ error: "Could not fetch the provided URL. Check that it is accessible." }, { status: 400 });
  }

  if (pageText.length < 50) {
    return NextResponse.json({ error: "Could not extract enough text content from the URL." }, { status: 400 });
  }

  // Build platform list for the prompt
  const platformList = platformIds
    .map((id) => PLATFORM_NAMES[id] ?? id)
    .join(", ");

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Based on this content from ${url}, generate ${postsPerPlatform} social media posts for each of these platforms: ${platformList}. Each post should be unique, engaging, and appropriate for the platform. Include relevant hashtags. Tone: ${tone}.

Page content:
${pageText}

Respond ONLY with valid JSON in this exact format, no other text:
{
  "posts": [
    {
      "platform": "PlatformName",
      "content": "The post content here...",
      "suggestedTime": "HH:MM"
    }
  ]
}

Generate exactly ${postsPerPlatform} posts per platform. For suggestedTime, suggest optimal posting times in 24h format. Ensure each post is unique and tailored to the specific platform's style and audience.`,
      },
    ],
  });

  const text = response.content[0];
  if (text?.type !== "text") {
    return NextResponse.json({ error: "No response from AI" }, { status: 500 });
  }

  // Parse the JSON response from Claude
  try {
    const jsonMatch = text.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ posts: data.posts });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}));
