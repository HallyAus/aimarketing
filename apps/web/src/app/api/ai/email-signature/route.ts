import { NextResponse } from "next/server";
import { callClaude, extractText } from "@/lib/ai";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { getThemeById } from "@/lib/image-gen/themes";
import { z } from "zod";

/* ── Validation ────────────────────────────────────────────────── */

const THEME_IDS = [
  "dark-tech",
  "clean-minimal",
  "bold-pop",
  "warm-editorial",
  "gradient-flow",
  "corporate-trust",
  "retro-vintage",
  "neon-night",
] as const;

const requestSchema = z.object({
  name: z.string().min(1).max(100),
  title: z.string().min(1).max(100),
  company: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  website: z.string().url().optional(),
  theme: z.enum(THEME_IDS).default("clean-minimal"),
});

/* ── Claude generates email signature HTML ─────────────────────── */

async function generateSignatureHtml(
  params: z.infer<typeof requestSchema>,
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ZodValidationError("AI service not configured. Set ANTHROPIC_API_KEY.");
  }

  const theme = getThemeById(params.theme);

  const contactLines = [
    `Email: <a href="mailto:${params.email}" style="color:inherit;text-decoration:none;">${params.email}</a>`,
    params.phone ? `Phone: <a href="tel:${params.phone}" style="color:inherit;text-decoration:none;">${params.phone}</a>` : null,
    params.website ? `Web: <a href="${params.website}" style="color:inherit;text-decoration:none;">${params.website.replace(/^https?:\/\//, "")}</a>` : null,
  ].filter(Boolean).join(" &nbsp;|&nbsp; ");

  const response = await callClaude({
    feature: "email_signature",
    messages: [
      {
        role: "user",
        content: `You are an expert email signature designer. Create a professional HTML email signature — NOT a full email, just the signature block that goes at the bottom of emails.

${theme.prompt}

PERSON DETAILS:
- Name: ${params.name}
- Title: ${params.title}
- Company: ${params.company}
- Email: ${params.email}${params.phone ? `\n- Phone: ${params.phone}` : ""}${params.website ? `\n- Website: ${params.website}` : ""}

DESIGN REQUIREMENTS:
1. Use ONLY inline styles — email clients strip <style> blocks entirely
2. Use table-based layout for Outlook compatibility (tables, tr, td — no flexbox or grid)
3. Maximum width: 600px
4. No images, no external resources, pure HTML/CSS only
5. Name should be prominent (largest text)
6. Title and company below the name, slightly smaller
7. A subtle horizontal separator line between name/title block and contact info
8. Contact info as clickable mailto:/tel:/https: links
9. Clean, professional — this goes on every email the person sends
10. Adapt the theme's color palette and typography feel using only inline styles (no Google Fonts — use web-safe font stacks that match the theme's personality)

Font stack guidance by theme aesthetic:
- Dark/tech themes: "Courier New", Courier, monospace or "Segoe UI", Arial, sans-serif
- Clean/corporate: "Segoe UI", Arial, Helvetica, sans-serif
- Warm/editorial: Georgia, "Times New Roman", serif
- Bold/pop: Impact, "Arial Black", Arial, sans-serif
- Retro/vintage: Georgia, "Palatino Linotype", serif

Return ONLY the raw HTML signature — no markdown, no explanation, no <!DOCTYPE>, no <html>, no <head>, no <body> tags.
Start directly with the outer <table> element.`,
      },
    ],
  });

  // Strip any accidental markdown fences or explanation text
  let html = extractText(response).trim();
  html = html.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  // Ensure it starts with a table tag
  if (!html.toLowerCase().startsWith("<table")) {
    const tableMatch = html.match(/<table[\s\S]*/i);
    if (tableMatch) html = tableMatch[0];
    else throw new Error("AI did not return a valid table-based signature");
  }

  return html;
}

/* ── POST ──────────────────────────────────────────────────────── */

export const POST = withErrorHandler(
  withRole("EDITOR", async (req) => {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
    }

    const html = await generateSignatureHtml(parsed.data);

    return NextResponse.json({ html });
  }),
);
