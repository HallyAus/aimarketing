import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { callClaude, extractText } from "@/lib/ai";

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

  const response = await callClaude({
    feature: "translate",
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
  });

  const rawText = extractText(response);

  let translations: Record<string, string>;
  try {
    translations = JSON.parse(rawText.trim());
  } catch {
    // Try extracting JSON from potential markdown code block
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      translations = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse translation response");
    }
  }

  return NextResponse.json({ original: content, translations });
}));
