import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

type ImagePreset = {
  width: number;
  height: number;
  label: string;
};

const PRESETS: Record<string, ImagePreset> = {
  "instagram-square": { width: 1080, height: 1080, label: "Instagram Square" },
  "instagram-story": { width: 1080, height: 1920, label: "Instagram Story" },
  "facebook-post": { width: 1200, height: 630, label: "Facebook Post" },
  "twitter-post": { width: 1200, height: 675, label: "Twitter Post" },
  "linkedin-post": { width: 1200, height: 627, label: "LinkedIn Post" },
  "tiktok-cover": { width: 1080, height: 1920, label: "TikTok Cover" },
  "youtube-thumbnail": { width: 1280, height: 720, label: "YouTube Thumbnail" },
  "pinterest-pin": { width: 1000, height: 1500, label: "Pinterest Pin" },
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1]!, 16), g: parseInt(result[2]!, 16), b: parseInt(result[3]!, 16) }
    : { r: 0, g: 0, b: 0 };
}

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      preset = "instagram-square",
      bgColor = "#000000",
      textColor = "#ffffff",
      fontSize = "large",
      align = "center",
      subtitle,
      subtitleColor = "#cccccc",
    } = body as {
      text: string;
      preset?: string;
      bgColor?: string;
      textColor?: string;
      fontSize?: "small" | "medium" | "large" | "xlarge";
      align?: "left" | "center" | "right";
      subtitle?: string;
      subtitleColor?: string;
    };

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const size = PRESETS[preset] ?? PRESETS["instagram-square"]!;
    const bg = hexToRgb(bgColor);

    const fontSizeMap = {
      small: Math.round(size.width * 0.035),
      medium: Math.round(size.width * 0.05),
      large: Math.round(size.width * 0.07),
      xlarge: Math.round(size.width * 0.1),
    };

    const mainFontSize = fontSizeMap[fontSize] ?? fontSizeMap.large;
    const subFontSize = Math.round(mainFontSize * 0.5);
    const lineHeight = mainFontSize * 1.4;
    const maxChars = Math.floor(size.width / (mainFontSize * 0.5));

    const lines = wrapText(text, maxChars);
    const subtitleLines = subtitle ? wrapText(subtitle, Math.floor(size.width / (subFontSize * 0.5))) : [];

    const totalTextHeight = lines.length * lineHeight + (subtitleLines.length > 0 ? subtitleLines.length * (subFontSize * 1.4) + 30 : 0);
    const startY = (size.height - totalTextHeight) / 2;

    const textAnchor = align === "left" ? "start" : align === "right" ? "end" : "middle";
    const textX = align === "left" ? size.width * 0.1 : align === "right" ? size.width * 0.9 : size.width / 2;

    let svgLines = "";
    lines.forEach((line, i) => {
      const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      svgLines += `<text x="${textX}" y="${startY + i * lineHeight}" font-family="Arial, Helvetica, sans-serif" font-size="${mainFontSize}" font-weight="bold" fill="${textColor}" text-anchor="${textAnchor}">${escaped}</text>`;
    });

    if (subtitleLines.length > 0) {
      const subStartY = startY + lines.length * lineHeight + 30;
      subtitleLines.forEach((line, i) => {
        const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        svgLines += `<text x="${textX}" y="${subStartY + i * (subFontSize * 1.4)}" font-family="Arial, Helvetica, sans-serif" font-size="${subFontSize}" fill="${subtitleColor}" text-anchor="${textAnchor}">${escaped}</text>`;
      });
    }

    const svg = `<svg width="${size.width}" height="${size.height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgb(${bg.r},${bg.g},${bg.b})"/>
      ${svgLines}
    </svg>`;

    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="adpilot-image.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[AI] Generate image error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}

// GET endpoint to list available presets
export async function GET() {
  return NextResponse.json({ presets: PRESETS });
}
