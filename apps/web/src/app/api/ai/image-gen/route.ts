import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Color palettes — each variation picks a random palette             */
/* ------------------------------------------------------------------ */
const COLOR_PALETTES = [
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#a18cd1", "#fbc2eb"],
  ["#ffecd2", "#fcb69f"],
  ["#2d3436", "#636e72"],
  ["#0c0c1d", "#1a1a3e", "#2d2d6e"],
  ["#1a1a2e", "#16213e", "#0f3460"],
];

/* ------------------------------------------------------------------ */
/*  Style configs                                                      */
/* ------------------------------------------------------------------ */
interface StyleConfig {
  defaultPalette: string[];
  overlay: (w: number, h: number) => string;
  fontWeight: string;
  textColor: string;
}

const STYLE_CONFIGS: Record<string, StyleConfig> = {
  "text-overlay": {
    defaultPalette: ["#667eea", "#764ba2"],
    overlay: () => "",
    fontWeight: "bold",
    textColor: "#ffffff",
  },
  "flat-design": {
    defaultPalette: ["#2d3436", "#636e72"],
    overlay: (w, h) => {
      const shapes: string[] = [];
      for (let i = 0; i < 4; i++) {
        const cx = Math.round(w * (0.15 + Math.random() * 0.7));
        const cy = Math.round(h * (0.15 + Math.random() * 0.7));
        const size = Math.round(Math.min(w, h) * (0.05 + Math.random() * 0.08));
        shapes.push(
          `<rect x="${cx}" y="${cy}" width="${size}" height="${size}" rx="4" fill="rgba(255,255,255,0.07)" transform="rotate(${Math.round(Math.random() * 45)}, ${cx + size / 2}, ${cy + size / 2})"/>`,
        );
      }
      return shapes.join("");
    },
    fontWeight: "bold",
    textColor: "#ffffff",
  },
  "photo-realistic": {
    defaultPalette: ["#1a1a2e", "#16213e", "#0f3460"],
    overlay: (_w, h) =>
      `<rect width="100%" height="100%" fill="url(#grad)" opacity="0.9"/><rect width="100%" y="${Math.round(h * 0.7)}" height="${Math.round(h * 0.3)}" fill="rgba(0,0,0,0.3)"/>`,
    fontWeight: "normal",
    textColor: "#ffffff",
  },
  illustration: {
    defaultPalette: ["#667eea", "#764ba2"],
    overlay: (w, h) =>
      `<circle cx="${Math.round(w * 0.15)}" cy="${Math.round(h * 0.2)}" r="80" fill="rgba(255,255,255,0.08)"/><circle cx="${Math.round(w * 0.85)}" cy="${Math.round(h * 0.7)}" r="120" fill="rgba(255,255,255,0.05)"/><circle cx="${Math.round(w * 0.5)}" cy="${Math.round(h * 0.9)}" r="60" fill="rgba(255,255,255,0.06)"/>`,
    fontWeight: "bold",
    textColor: "#ffffff",
  },
  "3d-render": {
    defaultPalette: ["#0c0c1d", "#1a1a3e", "#2d2d6e"],
    overlay: (w, h) =>
      `<ellipse cx="${Math.round(w * 0.5)}" cy="${Math.round(h * 0.8)}" rx="${Math.round(w * 0.4)}" ry="${Math.round(h * 0.15)}" fill="rgba(100,100,255,0.1)"/><ellipse cx="${Math.round(w * 0.3)}" cy="${Math.round(h * 0.3)}" rx="${Math.round(w * 0.15)}" ry="${Math.round(h * 0.08)}" fill="rgba(150,100,255,0.08)"/>`,
    fontWeight: "bold",
    textColor: "#ffffff",
  },
  watercolor: {
    defaultPalette: ["#a8edea", "#fed6e3"],
    overlay: (w, h) =>
      `<circle cx="${Math.round(w * 0.3)}" cy="${Math.round(h * 0.4)}" r="200" fill="rgba(255,255,255,0.15)"/><circle cx="${Math.round(w * 0.7)}" cy="${Math.round(h * 0.6)}" r="150" fill="rgba(255,200,200,0.1)"/>`,
    fontWeight: "normal",
    textColor: "#2d3436",
  },
};

/* ------------------------------------------------------------------ */
/*  Size presets                                                       */
/* ------------------------------------------------------------------ */
const SIZE_PRESETS: Record<string, { width: number; height: number }> = {
  "instagram-square": { width: 1080, height: 1080 },
  "instagram-story": { width: 1080, height: 1920 },
  "facebook-post": { width: 1200, height: 630 },
  "twitter-post": { width: 1600, height: 900 },
  "linkedin-post": { width: 1200, height: 627 },
  "tiktok-cover": { width: 1080, height: 1920 },
  "youtube-thumbnail": { width: 1280, height: 720 },
  custom: { width: 1080, height: 1080 },
};

/* ------------------------------------------------------------------ */
/*  Validation schema                                                  */
/* ------------------------------------------------------------------ */
const imageGenSchema = z.object({
  prompt: z.string().min(1).max(2000),
  style: z
    .enum([
      "text-overlay",
      "flat-design",
      "photo-realistic",
      "illustration",
      "3d-render",
      "watercolor",
    ])
    .optional()
    .default("flat-design"),
  size: z.string().optional().default("instagram-square"),
  width: z.number().min(100).max(4096).optional(),
  height: z.number().min(100).max(4096).optional(),
  count: z.number().min(1).max(5).optional().default(1),
  headline: z.string().max(200).optional(),
  subtext: z.string().max(300).optional(),
  textPosition: z.enum(["top", "center", "bottom"]).optional().default("center"),
  textColor: z.enum(["white", "black", "brand"]).optional().default("white"),
  brandName: z.string().max(100).optional(),
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveTextColor(textColor: string, style: string): string {
  if (textColor === "brand") return "#4facfe";
  if (textColor === "black") return "#1a1a2e";
  // For watercolor style default to dark text
  if (textColor === "white" && style === "watercolor") return "#2d3436";
  return "#ffffff";
}

function pickPalette(style: string, variationIndex: number): string[] {
  const config = STYLE_CONFIGS[style];
  if (variationIndex === 0 && config) return config.defaultPalette;
  // Deterministic-ish but varied: offset by style hash + variation
  const hash = style.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const idx = (hash + variationIndex * 3) % COLOR_PALETTES.length;
  return COLOR_PALETTES[idx]!;
}

/* ------------------------------------------------------------------ */
/*  SVG generation for one image                                       */
/* ------------------------------------------------------------------ */
function buildSvg(opts: {
  w: number;
  h: number;
  style: string;
  headline: string;
  subtext?: string;
  textPosition: string;
  textColor: string;
  brandName?: string;
  palette: string[];
  variation: number;
}): string {
  const { w, h, style, headline, subtext, textPosition, textColor, brandName, palette, variation } = opts;
  const config = STYLE_CONFIGS[style] ?? STYLE_CONFIGS["flat-design"]!;

  const mainFontSize = Math.round(w * 0.055);
  const subFontSize = Math.round(mainFontSize * 0.45);
  const brandFontSize = Math.round(mainFontSize * 0.35);
  const lineHeight = mainFontSize * 1.4;
  const maxChars = Math.floor(w / (mainFontSize * 0.5));

  const headlineLines = wrapText(headline, maxChars);
  const subtextLines = subtext ? wrapText(subtext, Math.floor(maxChars * 1.3)) : [];
  const totalLines = headlineLines.length + (subtextLines.length > 0 ? subtextLines.length + 0.5 : 0);
  const totalHeight = totalLines * lineHeight;

  // Compute Y start based on text position
  let startY: number;
  if (textPosition === "top") {
    startY = h * 0.12;
  } else if (textPosition === "bottom") {
    startY = h - totalHeight - h * 0.12;
  } else {
    startY = (h - totalHeight) / 2;
  }

  // Slightly shift position per variation
  startY += variation * lineHeight * 0.15;

  const resolvedColor = resolveTextColor(textColor, style);

  const gradStops = palette
    .map(
      (color, i) =>
        `<stop offset="${Math.round((i / Math.max(palette.length - 1, 1)) * 100)}%" stop-color="${color}"/>`,
    )
    .join("");

  let svgContent = "";

  // Headline
  headlineLines.forEach((line, i) => {
    svgContent += `<text x="${w / 2}" y="${startY + i * lineHeight}" font-family="Arial, Helvetica, sans-serif" font-size="${mainFontSize}" font-weight="${config.fontWeight}" fill="${resolvedColor}" text-anchor="middle">${escapeXml(line)}</text>`;
  });

  // Subtext
  if (subtextLines.length > 0) {
    const subStartY = startY + headlineLines.length * lineHeight + lineHeight * 0.5;
    const subLineHeight = subFontSize * 1.6;
    const subtextColor =
      resolvedColor === "#ffffff"
        ? "rgba(255,255,255,0.75)"
        : resolvedColor === "#2d3436"
          ? "rgba(45,52,54,0.7)"
          : resolvedColor;
    subtextLines.forEach((line, i) => {
      svgContent += `<text x="${w / 2}" y="${subStartY + i * subLineHeight}" font-family="Arial, Helvetica, sans-serif" font-size="${subFontSize}" fill="${subtextColor}" text-anchor="middle">${escapeXml(line)}</text>`;
    });
  }

  // Brand name in corner
  if (brandName) {
    svgContent += `<text x="${w - 20}" y="${h - 20}" font-family="Arial, Helvetica, sans-serif" font-size="${brandFontSize}" fill="rgba(255,255,255,0.5)" text-anchor="end">${escapeXml(brandName)}</text>`;
  }

  // AdPilot badge
  const badgeY = brandName ? h - 20 - brandFontSize - 8 : h - 20;
  svgContent += `<text x="${w / 2}" y="${badgeY}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(subFontSize * 0.8)}" fill="rgba(255,255,255,0.3)" text-anchor="middle">AdPilot AI  |  ${escapeXml(style)}</text>`;

  const overlayContent = config.overlay(w, h);

  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        ${gradStops}
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"/>
    ${overlayContent}
    ${svgContent}
  </svg>`;
}

/* ------------------------------------------------------------------ */
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */
export const POST = withErrorHandler(
  withRole("EDITOR", async (req: NextRequest) => {
    const body = await req.json();
    const parsed = imageGenSchema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }

    const { prompt, style, size, count, headline, subtext, textPosition, textColor, brandName } =
      parsed.data;

    const preset = SIZE_PRESETS[size] ?? SIZE_PRESETS["instagram-square"]!;
    const w = parsed.data.width ?? preset.width;
    const h = parsed.data.height ?? preset.height;

    const displayText = headline || prompt;

    const images: Array<{
      id: string;
      base64: string;
      style: string;
      variation: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      const palette = pickPalette(style, i);
      const svg = buildSvg({
        w,
        h,
        style,
        headline: displayText,
        subtext,
        textPosition,
        textColor,
        brandName,
        palette,
        variation: i,
      });

      const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
      const base64 = `data:image/png;base64,${buffer.toString("base64")}`;

      images.push({
        id: `img_${i + 1}`,
        base64,
        style,
        variation: i + 1,
      });
    }

    return NextResponse.json({ images });
  }),
);
