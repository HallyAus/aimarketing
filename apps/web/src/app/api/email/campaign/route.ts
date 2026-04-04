import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { callClaude, extractText } from "@/lib/ai";
import { getContentMemory } from "@/lib/content-memory";

// POST /api/email/campaign — create email content via AI or send
export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const { action, subject, brief, tone, recipients, template, htmlContent, orgId } = await req.json();

  if (action === "generate") {
    if (!brief) {
      return NextResponse.json({ error: "brief is required for generation", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI service not configured. Set ANTHROPIC_API_KEY.", code: "CONFIG_ERROR", statusCode: 503 }, { status: 503 });
    }

    const isLandingPage = template === "landing-page";

    const contentMemory = await getContentMemory(req.orgId);

    const prompt = isLandingPage
      ? `Create a complete, modern landing page based on this brief: ${brief}

${tone ? `Tone: ${tone}` : "Tone: professional"}

DESIGN SYSTEM:
- Google Fonts: Inter (400,500,600,700,800) — load via link tag
- Dark premium theme: background #0B0B0F, surfaces #12121A/#1A1A26
- Accent colors: blue #0066FF, cyan #00D4FF, orange #FF6B35, green #00E676
- Subtle grid overlay background (linear-gradient lines at 0.04 opacity)
- Glowing orb effects (absolute positioned divs with filter:blur, opacity 0.2-0.3)
- Gradient text for hero headlines (-webkit-background-clip: text)
- Monospace accents for labels/badges (font-family: 'JetBrains Mono', monospace)
- Glass-morphism cards (rgba backgrounds, backdrop-filter: blur, subtle borders)
- Smooth scroll behavior
- Mobile responsive (flexbox, max-width containers, media queries)

SECTIONS TO INCLUDE:
- Hero with headline, subheadline, CTA button, and floating badge
- Features/benefits grid (3-4 items with icon boxes)
- Social proof / stats bar
- How it works (numbered steps)
- FAQ accordion section (use details/summary for no-JS)
- Footer with links and brand

The page must be a complete HTML document. Make it responsive. Use inline styles or a <style> block — no external CSS files.

${contentMemory}

Return ONLY the raw HTML document — no JSON wrapping, no markdown code fences, no explanations. Start with <!DOCTYPE html>.`
      : `Create a professional marketing email based on this brief: ${brief}

${subject ? `Subject line suggestion: ${subject}` : ""}
${tone ? `Tone: ${tone}` : "Tone: professional"}
${template ? `Template style: ${template}` : ""}
${contentMemory ? `\n${contentMemory}\n` : ""}
Create a professional marketing email. Use this design system:

EMAIL DESIGN SYSTEM:
- Max width: 600px, centered with margin: 0 auto
- All styles MUST be inline (email clients strip <style> blocks)
- Background: #f5f5f7 for body, #ffffff for content area
- Font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Header: brand color background with white text, 24px padding
- Body: 32px padding, 16px font-size, #333333 text color, line-height 1.6
- CTA button: 48px height, 24px horizontal padding, border-radius 6px, brand color background, white text, display:inline-block
- Footer: #666666 text, 13px font-size, centered, with unsubscribe link placeholder
- Images: max-width:100%, display:block
- Use table-based layout for Outlook compatibility (wrap main content in <table> with role="presentation")
- Include MSO conditional comments for Outlook: <!--[if mso]><table><tr><td><![endif]-->
- Preheader text: hidden span at top with display:none for email preview

Return a JSON object with:
- "subject": compelling subject line
- "preheader": preview text (50-90 chars)
- "htmlBody": the complete email HTML (table-based, all inline styles, Outlook-safe)
- "plainText": plain text version

Return ONLY the JSON, no explanations.`;

    const response = await callClaude({
      feature: isLandingPage ? "landing_page" : "email_campaign",
      messages: [{ role: "user", content: prompt }],
    });

    if (isLandingPage) {
      // Return raw HTML directly — strip any markdown fences if present
      let html = extractText(response).trim();
      if (html.startsWith("```")) {
        html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
      }
      return NextResponse.json({ htmlBody: html });
    }

    let emailData;
    try {
      const rawText = extractText(response);
      emailData = JSON.parse(rawText.trim());
    } catch {
      const rawText = extractText(response);
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) emailData = JSON.parse(match[0]);
      else throw new Error("Failed to parse email generation response");
    }

    return NextResponse.json(emailData);
  }

  if (action === "send-test") {
    if (!htmlContent || !subject || !recipients?.length) {
      return NextResponse.json({ error: "htmlContent, subject, and recipients are required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
    }

    // Placeholder: In production, use Resend API
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'noreply@yourdomain.com',
    //   to: recipients,
    //   subject,
    //   html: htmlContent,
    // });

    return NextResponse.json({
      success: true,
      message: `Test email "${subject}" would be sent to ${recipients.length} recipient(s) via Resend. Configure RESEND_API_KEY to enable.`,
      recipients,
    });
  }

  if (action === "send") {
    if (!htmlContent || !subject || !recipients?.length) {
      return NextResponse.json({ error: "htmlContent, subject, and recipients are required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
    }

    // Placeholder: In production, use Resend batch API
    return NextResponse.json({
      success: true,
      message: `Campaign "${subject}" queued for ${recipients.length} recipient(s). Configure RESEND_API_KEY to enable sending.`,
      recipientCount: recipients.length,
    });
  }

  return NextResponse.json({ error: "Invalid action. Use generate, send-test, or send.", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
}));
