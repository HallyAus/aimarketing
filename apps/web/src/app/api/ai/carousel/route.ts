import { NextResponse } from "next/server";
import { callClaude, extractText } from "@/lib/ai";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { getContentMemory } from "@/lib/content-memory";
import { renderHtmlToJpeg } from "@/lib/image-gen/render";
import { z } from "zod";

const carouselSchema = z.object({
  topic: z.string().min(1).max(2000),
  platform: z.enum(["instagram", "linkedin"]),
  numSlides: z.number().int().min(3).max(10),
  tone: z.string().max(100).optional(),
  content: z.string().max(10000).optional(),
});

/* ── Design system prompt (mirrors image-gen aesthetic) ─────────── */

const CAROUSEL_DESIGN_PROMPT = `You are an elite marketing designer creating Instagram carousel slides as complete HTML/CSS documents.

DESIGN PRINCIPLES — follow these exactly:
- Dark premium background: #0B0B0F base, vary slightly per slide (#12121A, #0D0D15)
- Glowing orb effects: absolute-positioned divs with border-radius:50%, filter:blur(80-120px), opacity 0.15-0.35, in blue/purple/cyan
- Subtle dot-grid overlay: background-image using radial-gradient dots at low opacity (0.04-0.08)
- Google Fonts: DM Sans for body text, Sora for headlines (700-800 weight), JetBrains Mono for badges/accents/numbers
- Gradient text on headlines: background: linear-gradient(135deg, #FFFFFF 0%, #A0A8C0 100%), -webkit-background-clip:text, -webkit-text-fill-color:transparent — OR blue-to-cyan for accent elements (#0066FF → #00D4FF)
- Monospace accent badges: font-family JetBrains Mono, background rgba(255,255,255,0.06), border 1px solid rgba(255,255,255,0.12), border-radius 6px, padding 4px 10px
- Color accents: primary blue #0066FF, cyan #00D4FF, purple #8B5CF6, emerald #00E676, amber #F59E0B
- Slide number badge: top-left corner, JetBrains Mono, e.g. "01 / 05", small badge style
- Navigation dots: bottom-center, active dot wider pill shape in blue, inactive dots small gray circles
- Typography: Sora headline 72-96px bold, DM Sans body 28-36px, generous line height 1.4-1.6
- Content layout varies per slide: centered hero, left-aligned bullets, stat callout, quote block, CTA

EVERY slide must include:
- Google Fonts <link> in <head> for DM Sans, Sora, JetBrains Mono
- A dot-grid or line-grid overlay div (position:absolute, full size, low opacity)
- 2-3 glow orb divs (position:absolute, border-radius:50%, filter:blur)
- Slide number badge top-left (e.g. "01 / 05")
- Navigation dots at the bottom showing which slide is active
- body and root div exactly 1080x1080px, margin:0, overflow:hidden`;

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = carouselSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { topic, platform, numSlides, tone, content } = parsed.data;
  const platformName = platform === "instagram" ? "Instagram" : "LinkedIn";
  const contentMemory = await getContentMemory(req.orgId);

  const response = await callClaude({
    feature: "carousel",
    maxTokens: 32000,
    messages: [
      {
        role: "user",
        content: `${CAROUSEL_DESIGN_PROMPT}

Create a ${numSlides}-slide ${platformName} carousel about:
"${topic}"

${tone ? `Tone: ${tone}` : ""}
${content ? `Additional context/content:\n${content.slice(0, 5000)}` : ""}

Carousel structure:
- Slide 1: Hook — bold attention-grabbing title, teaser of what's coming
- Slides 2 to ${numSlides - 1}: One key insight/tip/point per slide, varied layouts
- Slide ${numSlides}: CTA — strong call-to-action, invite to follow/save/share

Each slide must be visually connected (same color palette, same glow style) but have different layouts and content emphasis.

Return ONLY a JSON object (no markdown fences):
{
  "caption": "Ready-to-post social caption with hashtags (2-3 sentences)",
  "slides": [
    {
      "slideNumber": 1,
      "html": "<!DOCTYPE html>...complete standalone HTML document for this slide..."
    }
  ]
}

CRITICAL:
- Each "html" is a COMPLETE standalone HTML document starting with <!DOCTYPE html>
- Body must be exactly 1080px × 1080px, margin:0, overflow:hidden
- Slide number badge shows "01 / ${String(numSlides).padStart(2, "0")}" etc.
- Navigation dots: ${numSlides} total, active dot on current slide
- Make headlines large and readable on a phone (72-96px minimum)
- DO NOT use external image URLs or placeholder images
- Return ONLY the JSON, no explanation${contentMemory}`,
      },
    ],
  });

  let parsed2: { caption?: string; slides?: Array<{ slideNumber: number; html: string }> };
  try {
    const cleaned = extractText(response).replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    try {
      parsed2 = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");
      parsed2 = JSON.parse(match[0]);
    }
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  const rawSlides = parsed2.slides ?? [];
  const caption = parsed2.caption ?? "";

  /* ── Render each slide HTML to JPEG via Puppeteer ────────────── */
  const slides = await Promise.all(
    rawSlides.map(async (slide) => {
      const buffer = await renderHtmlToJpeg(slide.html, 1080, 1080);
      const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      return {
        slideNumber: slide.slideNumber,
        base64,
        html: slide.html,
      };
    }),
  );

  return NextResponse.json({ slides, caption });
}));
