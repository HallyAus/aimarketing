import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { renderCardToPng, generateCardHtml, SIZE_PRESETS } from "@/lib/image-gen/render";
import type { CardSpec, TemplateName } from "@/lib/image-gen/types";
import { z } from "zod";

/* ── Anthropic client ──────────────────────────────────────────── */

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  return _client;
}

/* ── Validation ────────────────────────────────────────────────── */

const VALID_TEMPLATES: TemplateName[] = [
  "product-showcase", "announcement", "sale-promo", "testimonial",
  "stats", "tips-howto", "before-after", "event-launch",
  "brand-story", "carousel-card",
];

const requestSchema = z.object({
  url: z.string().url().optional(),
  prompt: z.string().max(2000).optional(),
  platform: z.string().default("instagram-square"),
  count: z.number().min(1).max(5).default(3),
  brandName: z.string().max(100).optional(),
  brandVoiceId: z.string().optional(),
  regenerateSpec: z.any().optional(),
}).refine((d) => d.url || d.prompt || d.regenerateSpec, {
  message: "Provide a URL, prompt, or spec to regenerate",
});

/* ── URL content extraction ────────────────────────────────────── */

async function extractUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AdPilot/1.0 (content extraction)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Extract useful text from HTML
    const title = html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.trim() ?? "";
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is)?.[1]?.trim() ?? "";
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/is)?.[1]?.trim() ?? "";
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/is)?.[1]?.trim() ?? "";

    // Strip HTML tags for body text (first ~2000 chars of visible text)
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 2000);

    return [
      ogTitle || title ? `Title: ${ogTitle || title}` : "",
      ogDesc || metaDesc ? `Description: ${ogDesc || metaDesc}` : "",
      bodyText ? `Content: ${bodyText}` : "",
    ].filter(Boolean).join("\n\n");
  } catch {
    throw new ZodValidationError("Could not fetch the URL. Check the link and try again.");
  }
}

/* ── Claude creative brief generation ──────────────────────────── */

async function generateCardSpecs(
  content: string,
  count: number,
  width: number,
  height: number,
  brandName?: string,
): Promise<CardSpec[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ZodValidationError("AI service not configured. Set ANTHROPIC_API_KEY.");
  }

  const aspectRatio = width > height ? "landscape" : width === height ? "square" : "portrait";

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are a marketing creative director. Generate ${count} diverse marketing image card specifications based on this content.

CONTENT:
${content}

IMAGE DIMENSIONS: ${width}x${height} (${aspectRatio})
${brandName ? `BRAND: ${brandName}` : ""}

Return a JSON array of ${count} card specs. Each spec MUST use a DIFFERENT template and visual style. Be creative with colors — don't repeat palettes.

Available templates: ${VALID_TEMPLATES.join(", ")}

JSON Schema for each card:
{
  "template": "one of the templates above",
  "headline": "max 60 chars, punchy marketing copy",
  "subtext": "max 120 chars, supporting text",
  "cta": "call to action text like 'Shop Now'",
  "metric": "for stats/sale-promo: big number like '50% OFF' or '10,000+'",
  "metricLabel": "label under the metric",
  "steps": ["for tips-howto only: 3-5 short tips"],
  "quote": "for testimonial: a customer quote",
  "attribution": "for testimonial: who said it",
  "beforeText": "for before-after: the before state",
  "afterText": "for before-after: the after state",
  "eventDate": "for event-launch: formatted date",
  "palette": ["#hex1", "#hex2"],
  "accentColor": "#hex",
  "mood": "bold|elegant|playful|minimal|warm",
  "brandName": "${brandName || "extract from content if possible"}",
  "brandTagline": "short tagline if relevant"
}

Only include fields relevant to each template. Omit null/empty fields.
${aspectRatio === "portrait" ? "For portrait/story format, favor bold headlines and less text." : ""}
${aspectRatio === "landscape" ? "For landscape format, use wider layouts with supporting text." : ""}

Return ONLY the JSON array. No markdown, no explanations.`,
      },
    ],
  });

  const text = response.content[0];
  if (text?.type !== "text") throw new Error("No text in AI response");

  const cleaned = text.text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const specs: CardSpec[] = JSON.parse(cleaned);

  // Validate and sanitize
  return specs.slice(0, count).map((spec) => ({
    ...spec,
    template: VALID_TEMPLATES.includes(spec.template) ? spec.template : "announcement",
    headline: (spec.headline ?? "").substring(0, 80),
    subtext: spec.subtext?.substring(0, 150),
    palette: Array.isArray(spec.palette) && spec.palette.length === 2
      ? spec.palette as [string, string]
      : ["#667eea", "#764ba2"],
    accentColor: spec.accentColor ?? "#4facfe",
    mood: (["bold", "elegant", "playful", "minimal", "warm"] as const).includes(spec.mood as any)
      ? spec.mood
      : "bold",
  }));
}

/* ── Route handler ─────────────────────────────────────────────── */

export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const { url, prompt, platform, count, brandName, regenerateSpec } = parsed.data;
    const preset = SIZE_PRESETS[platform] ?? SIZE_PRESETS["instagram-square"]!;
    const { width, height } = preset;

    // ── Single card regeneration ──────────────────────────────
    if (regenerateSpec) {
      const spec = regenerateSpec as CardSpec;
      const html = generateCardHtml(spec, width, height);
      const buffer = await renderCardToPng(spec, width, height);
      const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        images: [{
          id: `regen_${Date.now()}`,
          base64,
          html,
          spec,
          width,
          height,
        }],
      });
    }

    // ── Extract content ───────────────────────────────────────
    let content = prompt ?? "";
    let extractedContent: string | undefined;

    if (url) {
      extractedContent = await extractUrlContent(url);
      content = extractedContent;
    }

    if (!content.trim()) {
      throw new ZodValidationError("No content to generate images from.");
    }

    // ── Generate creative briefs via Claude ────────────────────
    const specs = await generateCardSpecs(content, count, width, height, brandName);

    // ── Render all cards to PNG + generate HTML ─────────────────
    const images = await Promise.all(
      specs.map(async (spec, i) => {
        const html = generateCardHtml(spec, width, height);
        const buffer = await renderCardToPng(spec, width, height);
        const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
        return {
          id: `img_${i + 1}_${Date.now()}`,
          base64,
          html,
          spec,
          width,
          height,
        };
      }),
    );

    return NextResponse.json({
      images,
      extractedContent,
    });
  }),
);
