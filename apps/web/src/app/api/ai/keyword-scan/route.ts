import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { z } from "zod";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  return _client;
}

const schema = z.object({
  yourUrl: z.string().url().max(2000),
  competitorUrls: z.array(z.string().url().max(2000)).min(1).max(3),
});

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AdPilot/1.0 (Keyword Analyzer)" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 5000);
  } catch {
    return `[Failed to fetch ${url}]`;
  }
}

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { yourUrl, competitorUrls } = parsed.data;

  // Fetch all pages in parallel
  const [yourText, ...competitorTexts] = await Promise.all([
    fetchPageText(yourUrl),
    ...competitorUrls.map(fetchPageText),
  ]);

  const competitorSections = competitorUrls.map((u, i) =>
    `--- Competitor ${i + 1} (${u}) ---\n${competitorTexts[i]}`
  ).join("\n\n");

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{
      role: "user",
      content: `Analyze the keyword strategy for these websites. Compare the user's site vs competitors.

YOUR SITE (${yourUrl}):
${yourText}

COMPETITORS:
${competitorSections}

Return ONLY valid JSON (no markdown, no code fences):
{
  "yourKeywords": ["keyword1", "keyword2", ...up to 20 keywords found on user's site],
  "competitorKeywords": ["keyword1", "keyword2", ...up to 20 unique keywords across competitor sites],
  "gaps": [
    {"keyword": "keyword competitors have but user doesn't", "difficulty": "Low/Medium/High", "recommendation": "brief strategy note"},
    ...up to 10 gap keywords
  ],
  "overlap": ["keywords both sides cover"],
  "recommendations": [
    {"title": "Content piece title", "description": "Brief description of content to create", "targetKeyword": "primary keyword to target"},
    ...up to 5 recommendations
  ]
}`,
    }],
  });

  const text = response.content[0];
  if (text?.type !== "text") throw new Error("No text in AI response");

  try {
    const cleaned = text.text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const result = JSON.parse(cleaned);
    return NextResponse.json(result);
  } catch {
    throw new Error("Failed to parse AI response");
  }
}));
