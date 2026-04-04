import { NextResponse } from "next/server";
import { callClaude, extractText } from "@/lib/ai";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { getContentMemory } from "@/lib/content-memory";
import { prisma } from "@/lib/db";
import { renderHtmlToJpeg, SIZE_PRESETS } from "@/lib/image-gen/render";
import { z } from "zod";

/* ── Validation ────────────────────────────────────────────────── */

const requestSchema = z.object({
  url: z.string().url().optional(),
  prompt: z.string().max(2000).optional(),
  platform: z.string().default("instagram-square"),
  count: z.number().min(1).max(5).default(3),
  brandName: z.string().max(100).optional(),
  theme: z.string().default("dark-tech"),
  pageId: z.string().optional(),
  regeneratePrompt: z.string().optional(),
  regenerateHtml: z.string().optional(),
}).refine((d) => d.url || d.prompt || d.regeneratePrompt || d.regenerateHtml, {
  message: "Provide a URL, prompt, or content to regenerate",
});

/* ── URL content extraction ────────────────────────────────────── */

async function extractUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ReachPilot/1.0; +https://reachpilot.co)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const title = html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.trim() ?? "";
    const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is)?.[1]?.trim() ?? "";
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/is)?.[1]?.trim() ?? "";
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/is)?.[1]?.trim() ?? "";

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

/* ── Claude generates complete HTML cards ──────────────────────── */

import { getThemeById } from "@/lib/image-gen/themes";

async function generateCardsHtml(
  content: string,
  count: number,
  width: number,
  height: number,
  brandName?: string,
  themeId?: string,
  contentMemory?: string,
): Promise<{ caption: string; cards: Array<{ type: string; html: string }> }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ZodValidationError("AI service not configured. Set ANTHROPIC_API_KEY.");
  }

  const aspectRatio = width > height ? "landscape" : width === height ? "square" : "portrait";
  const theme = getThemeById(themeId ?? "dark-tech");

  const response = await callClaude({
    feature: "image_gen",
    messages: [
      {
        role: "user",
        content: `You are an elite marketing designer who creates stunning social media graphics as HTML/CSS. Your designs match professional agency quality.

${theme.prompt}

EVERY card must include:
- Appropriate Google Fonts loaded via <link> tag in <head>
- Visual depth through layered elements (decorative shapes, shadows, overlays)
- Proper z-index layering
- The body and root div must be exactly the specified width and height with overflow:hidden

Create ${count} DIFFERENT marketing image cards as complete, standalone HTML documents. Each must be visually distinct — different layouts, different color emphasis, different content angles.

CONTENT TO MARKET:
${content}

${brandName ? `BRAND NAME: ${brandName}` : ""}
DIMENSIONS: ${width}x${height}px (${aspectRatio})

Card types to create (pick ${count} different ones, vary them):
- Hero announcement (big headline, feature list, CTA)
- Stats/metric card (huge number like "$0" or "10,000+", supporting text)
- Before/after comparison (split layout)
- Tips/how-to (numbered steps, clean layout)
- Testimonial/social proof (quote, attribution)
- Sale/promo (big discount, urgency)
- Feature spotlight (one key feature explained)
- Brand story (editorial, warm)

Return a JSON object:
{
  "caption": "Ready-to-post social media caption with hashtags (2-3 sentences)",
  "cards": [
    {
      "type": "short description of what this card is",
      "html": "<!DOCTYPE html>...complete HTML document..."
    }
  ]
}

CRITICAL RULES:
- Each "html" value is a COMPLETE standalone HTML document starting with <!DOCTYPE html>
- Body must be exactly ${width}px wide and ${height}px tall with overflow:hidden, margin:0
- Use the Google Fonts link in <head>
- Make text large enough to read on a phone — headlines at least 5% of width
- Include the brand name visually on each card
- Each card must look completely different from the others
- DO NOT use placeholder images or external image URLs
- Return ONLY the JSON. No markdown fences, no explanations.${contentMemory ?? ""}`,
      },
    ],
  });

  const raw = extractText(response).replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  // Try standard JSON parse first
  let caption = "";
  let htmlCards: Array<{ type: string; html: string }> = [];

  try {
    const parsed = JSON.parse(raw);
    caption = parsed.caption ?? "";
    htmlCards = (parsed.cards ?? []).slice(0, count).map((c: { type?: string; html: string }) => ({
      type: c.type ?? "",
      html: c.html,
    }));
  } catch {
    // JSON parse failed — HTML likely contains unescaped quotes.
    // Extract HTML blocks manually.
    const htmlBlocks = raw.match(/<!DOCTYPE html>[\s\S]*?<\/html>/gi) ?? [];
    const capMatch = raw.match(/"caption"\s*:\s*"([^"]{10,300})"/);
    caption = capMatch?.[1] ?? "";

    htmlCards = htmlBlocks.slice(0, count).map((html, i) => ({
      type: `card-${i + 1}`,
      html,
    }));

    if (htmlCards.length === 0) throw new Error("Failed to parse AI response — no HTML blocks found");
  }

  return { caption, cards: htmlCards };
}

/* ── GET: load cached images ───────────────────────────────────── */

export const GET = withErrorHandler(
  withRole("VIEWER", async (req) => {
    const url = new URL(req.url);
    const pageId = url.searchParams.get("pageId") || undefined;

    // Purge expired images first
    await prisma.generatedImage.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const cached = await prisma.generatedImage.findMany({
      where: {
        orgId: req.orgId,
        ...(pageId ? { pageId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({
      images: cached.map((img) => ({
        id: img.id,
        base64: img.base64,
        html: img.html,
        type: img.type,
        caption: img.caption,
        prompt: img.prompt,
        expiresAt: img.expiresAt.toISOString(),
        createdAt: img.createdAt.toISOString(),
      })),
    });
  }),
);

/* ── DELETE: remove a cached image ─────────────────────────────── */

export const DELETE = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.generatedImage.deleteMany({
      where: { id, orgId: req.orgId },
    });

    return NextResponse.json({ success: true });
  }),
);

/* ── POST: generate new images ─────────────────────────────────── */

export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const { url, prompt, platform, count, brandName, theme, pageId: reqPageId, regeneratePrompt, regenerateHtml } = parsed.data;
    const preset = SIZE_PRESETS[platform] ?? SIZE_PRESETS["instagram-square"]!;
    const { width, height } = preset;

    // ── Single card regeneration (from edited HTML) ───────────
    if (regenerateHtml) {
      const buffer = await renderHtmlToJpeg(regenerateHtml, width, height);
      const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      return NextResponse.json({
        images: [{
          id: `regen_${Date.now()}`,
          base64,
          html: regenerateHtml,
          type: "regenerated",
          width,
          height,
        }],
      });
    }

    // ── Extract content ───────────────────────────────────────
    let content = prompt ?? "";
    let extractedContent: string | undefined;
    let urlFetchWarning: string | undefined;

    if (url) {
      try {
        extractedContent = await extractUrlContent(url);
        content = extractedContent;
      } catch {
        // URL fetch failed — fall back to using the URL itself as context
        urlFetchWarning = "Could not fetch URL content. Using URL and prompt as context.";
        content = content || `Marketing content for: ${url}`;
      }
    }

    if (regeneratePrompt) {
      content = regeneratePrompt;
    }

    if (!content.trim()) {
      throw new ZodValidationError("No content to generate images from.");
    }

    // ── Generate HTML cards via Claude ─────────────────────────
    const contentMemory = await getContentMemory(req.orgId);
    const { caption: generatedCaption, cards: generatedCards } = await generateCardsHtml(content, count, width, height, brandName, theme, contentMemory);

    // ── Render all cards to JPEG ──────────────────────────────
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const promptSummary = (content ?? "").substring(0, 200);

    const images = await Promise.all(
      generatedCards.map(async (card, i) => {
        const buffer = await renderHtmlToJpeg(card.html, width, height);
        const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;

        // Save to DB
        const saved = await prisma.generatedImage.create({
          data: {
            orgId: req.orgId,
            pageId: reqPageId ?? null,
            base64,
            html: card.html,
            type: card.type || `card-${i + 1}`,
            caption: generatedCaption,
            prompt: promptSummary,
            expiresAt,
          },
        });

        return {
          id: saved.id,
          base64,
          html: card.html,
          type: card.type || `card-${i + 1}`,
          caption: generatedCaption,
          expiresAt: expiresAt.toISOString(),
          createdAt: saved.createdAt.toISOString(),
          width,
          height,
        };
      }),
    );

    return NextResponse.json({
      images,
      extractedContent,
      warning: urlFetchWarning,
    });
  }),
);
