import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { withAiUsageTracking } from "@/lib/usage-limits";
import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  return _client;
}

const SUPPORTED_LANGUAGES = [
  "Spanish", "French", "German", "Japanese", "Chinese",
  "Portuguese", "Arabic", "Korean", "Italian", "Dutch",
];

// POST /api/ai/translate — translate post content into target languages
export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const { content, targetLanguages, tone } = await req.json();
  if (!content || !targetLanguages?.length) {
    return NextResponse.json({ error: "content and targetLanguages are required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const validLangs = targetLanguages.filter((l: string) => SUPPORTED_LANGUAGES.includes(l));
  if (!validLangs.length) {
    return NextResponse.json({ error: "No valid target languages", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const response = await withAiUsageTracking((req as any).orgId, () => getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Translate the following social media post into these languages: ${validLangs.join(", ")}.

Original post:
${content}

Requirements:
- Maintain the original tone${tone ? ` (${tone})` : ""} and style
- Preserve all hashtags (translate them if culturally appropriate, otherwise keep original)
- Preserve emojis
- Adapt cultural references where needed
- Each translation should feel native, not machine-translated

Return ONLY a JSON object with language names as keys and translated text as values. Example:
{"Spanish": "...", "French": "..."}

No explanations, just the JSON.`,
      },
    ],
  }));

  const text = response.content[0];
  if (text?.type !== "text") throw new Error("No text in AI response");

  let translations: Record<string, string>;
  try {
    translations = JSON.parse(text.text.trim());
  } catch {
    // Try extracting JSON from potential markdown code block
    const jsonMatch = text.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      translations = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse translation response");
    }
  }

  return NextResponse.json({ original: content, translations });
}));
