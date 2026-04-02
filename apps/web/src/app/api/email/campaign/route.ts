import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  return _client;
}

// POST /api/email/campaign — create email content via AI or send
export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const { action, subject, brief, tone, recipients, template, htmlContent } = await req.json();

  if (action === "generate") {
    if (!brief) {
      return NextResponse.json({ error: "brief is required for generation", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
    }

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Create a professional marketing email based on this brief: ${brief}

${subject ? `Subject line suggestion: ${subject}` : ""}
${tone ? `Tone: ${tone}` : "Tone: professional"}
${template ? `Template style: ${template}` : ""}

Return a JSON object with these keys:
- "subject": the email subject line
- "preheader": a short preview text (50-90 chars)
- "htmlBody": the full HTML email body with inline styles. Use a clean, modern design with a max-width of 600px. Include a header, body content, and footer. Use professional colors.
- "plainText": plain text version of the email

Return ONLY the JSON, no explanations.`,
        },
      ],
    });

    const text = response.content[0];
    if (text?.type !== "text") throw new Error("No text in AI response");

    let emailData;
    try {
      emailData = JSON.parse(text.text.trim());
    } catch {
      const match = text.text.match(/\{[\s\S]*\}/);
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
