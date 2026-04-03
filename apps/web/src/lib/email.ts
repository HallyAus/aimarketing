import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Lazy Resend initialization
// ---------------------------------------------------------------------------

let resendInstance: import("resend").Resend | null = null;

function getResend(): import("resend").Resend | null {
  if (resendInstance) return resendInstance;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require("resend") as typeof import("resend");
  resendInstance = new Resend(apiKey);
  return resendInstance;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const DEFAULT_FROM = "AdPilot <noreply@adpilot.com>";

/**
 * Send an email via Resend. Falls back to logging the email when no
 * RESEND_API_KEY is configured (useful in development).
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const { to, subject, html, text } = options;
  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  const resend = getResend();

  if (!resend) {
    logger.info("Email send (no Resend API key — logged only)", {
      to,
      subject,
      from,
    });
    return { success: true, id: "dev-noop" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    if (error) {
      logger.error("Failed to send email via Resend", {
        error: error.message,
        to,
        subject,
      });
      return { success: false, error: error.message };
    }

    logger.info("Email sent successfully", { id: data?.id, to, subject });
    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Unexpected error sending email", {
      error: message,
      to,
      subject,
    });
    return { success: false, error: message };
  }
}
