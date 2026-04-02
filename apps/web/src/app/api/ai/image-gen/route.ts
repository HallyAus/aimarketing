import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { z } from "zod";

const STYLE_CONFIGS: Record<
  string,
  { bgGradient: string[]; overlay: string; fontWeight: string }
> = {
  "photo-realistic": {
    bgGradient: ["#1a1a2e", "#16213e", "#0f3460"],
    overlay:
      '<rect width="100%" height="100%" fill="url(#grad)" opacity="0.9"/>',
    fontWeight: "normal",
  },
  illustration: {
    bgGradient: ["#667eea", "#764ba2"],
    overlay:
      '<circle cx="15%" cy="20%" r="80" fill="rgba(255,255,255,0.08)"/><circle cx="85%" cy="70%" r="120" fill="rgba(255,255,255,0.05)"/>',
    fontWeight: "bold",
  },
  "flat-design": {
    bgGradient: ["#2d3436", "#636e72"],
    overlay: "",
    fontWeight: "bold",
  },
  "3d-render": {
    bgGradient: ["#0c0c1d", "#1a1a3e", "#2d2d6e"],
    overlay:
      '<ellipse cx="50%" cy="80%" rx="40%" ry="15%" fill="rgba(100,100,255,0.1)"/>',
    fontWeight: "bold",
  },
  watercolor: {
    bgGradient: ["#a8edea", "#fed6e3"],
    overlay:
      '<circle cx="30%" cy="40%" r="200" fill="rgba(255,255,255,0.15)"/><circle cx="70%" cy="60%" r="150" fill="rgba(255,200,200,0.1)"/>',
    fontWeight: "normal",
  },
};

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

const imageGenSchema = z.object({
  prompt: z.string().min(1).max(2000),
  style: z
    .enum([
      "photo-realistic",
      "illustration",
      "flat-design",
      "3d-render",
      "watercolor",
    ])
    .optional()
    .default("flat-design"),
  size: z.string().optional().default("instagram-square"),
  width: z.number().min(100).max(4096).optional(),
  height: z.number().min(100).max(4096).optional(),
});

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

export const POST = withErrorHandler(
  withRole("EDITOR", async (req: NextRequest) => {
    const body = await req.json();
    const parsed = imageGenSchema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(
        parsed.error.issues.map((i) => i.message).join(", ")
      );
    }

    const { prompt, style, size } = parsed.data;
    const preset = SIZE_PRESETS[size] ?? SIZE_PRESETS["instagram-square"]!;
    const w = parsed.data.width ?? preset.width;
    const h = parsed.data.height ?? preset.height;
    const styleConfig = STYLE_CONFIGS[style] ?? STYLE_CONFIGS["flat-design"]!;

    const mainFontSize = Math.round(w * 0.055);
    const subFontSize = Math.round(mainFontSize * 0.45);
    const lineHeight = mainFontSize * 1.4;
    const maxChars = Math.floor(w / (mainFontSize * 0.5));

    const lines = wrapText(prompt, maxChars);
    const totalHeight = lines.length * lineHeight;
    const startY = (h - totalHeight) / 2;

    const gradStops = styleConfig.bgGradient
      .map(
        (color, i) =>
          `<stop offset="${Math.round((i / (styleConfig.bgGradient.length - 1)) * 100)}%" stop-color="${color}"/>`
      )
      .join("");

    let svgLines = "";
    lines.forEach((line, i) => {
      const textColor =
        style === "watercolor" ? "#2d3436" : "#ffffff";
      svgLines += `<text x="${w / 2}" y="${startY + i * lineHeight}" font-family="Arial, Helvetica, sans-serif" font-size="${mainFontSize}" font-weight="${styleConfig.fontWeight}" fill="${textColor}" text-anchor="middle">${escapeXml(line)}</text>`;
    });

    // Style badge at bottom
    const badgeY = h - 40;
    svgLines += `<text x="${w / 2}" y="${badgeY}" font-family="Arial, Helvetica, sans-serif" font-size="${subFontSize}" fill="rgba(255,255,255,0.4)" text-anchor="middle">AdPilot AI Generated  |  ${style}</text>`;

    const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          ${gradStops}
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      ${styleConfig.overlay}
      ${svgLines}
    </svg>`;

    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="adpilot-ai-image.png"`,
        "Cache-Control": "no-store",
      },
    });
  })
);
