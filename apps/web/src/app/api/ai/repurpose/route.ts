import { NextResponse } from "next/server";
import { callClaude, extractText } from "@/lib/ai";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { withRole } from "@/lib/auth-middleware";
import { getContentMemory } from "@/lib/content-memory";
import { z } from "zod";

const repurposeSchema = z.object({
  content: z.string().min(1).max(50000),
  url: z.string().url().max(2048).optional(),
  formats: z.array(z.string().min(1).max(50)).min(1).max(10),
  variationsPerFormat: z.number().int().min(1).max(5),
});

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = repurposeSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  let { content, url, formats, variationsPerFormat } = parsed.data;

  // If URL provided, fetch content from it
  if (url) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ReachPilot/1.0)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const html = await res.text();
        const extracted = stripHtml(html).slice(0, 8000);
        if (extracted.length > 50) {
          content = extracted;
        }
      }
    } catch {
      // Fall back to provided content
    }
  }

  const formatInstructions = formats.map((f) => {
    switch (f) {
      case "facebook":
        return `Facebook posts: Engaging, conversational, 1-3 paragraphs, include emojis and a call-to-action.`;
      case "instagram":
        return `Instagram captions: Visual-first, include relevant hashtags (10-15), use emojis, engaging first line as hook.`;
      case "linkedin":
        return `LinkedIn posts: Professional tone, thought-leadership style, include a hook opening, use line breaks for readability.`;
      case "twitter":
        return `Twitter/X posts: Concise (under 280 chars), punchy, include 1-2 relevant hashtags.`;
      case "email":
        return `Email newsletter: Include a subject line, preview text, and body content. Professional but warm tone.`;
      case "thread":
        return `Twitter/X thread: 3-7 tweets that tell a story, numbered, each under 280 chars, first tweet is the hook.`;
      case "linkedin-article":
        return `LinkedIn article: Long-form with title, subheadings, and 3-5 paragraphs. Professional thought-leadership style.`;
      case "carousel":
        return `Instagram carousel captions: One caption per slide concept (5-7 slides), each with a clear point, final slide has CTA.`;
      default:
        return `${f}: Create appropriate content for this format.`;
    }
  }).join("\n");

  const contentMemory = await getContentMemory(req.orgId);

  const response = await callClaude({
    feature: "repurpose",
    messages: [
      {
        role: "user",
        content: `Repurpose the following content into multiple formats. Generate ${variationsPerFormat} variation(s) per format.

Source content:
${content.slice(0, 8000)}

Formats needed:
${formatInstructions}

Respond ONLY with valid JSON in this exact format, no other text:
{
  "results": [
    {
      "format": "format_name",
      "platform": "platform_name or null",
      "items": [
        {
          "content": "The repurposed content here...",
          "title": "Optional title if applicable"
        }
      ]
    }
  ]
}

Make each variation unique with different angles, hooks, or approaches. Ensure content is ready to use as-is.${contentMemory}`,
      },
    ],
  });

  const rawText = extractText(response);

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ results: data.results });
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}));
