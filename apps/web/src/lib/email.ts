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
let resendInitAttempted = false;

async function getResend(): Promise<import("resend").Resend | null> {
  if (resendInstance) return resendInstance;
  if (resendInitAttempted) return null;
  resendInitAttempted = true;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("RESEND_API_KEY not configured — emails will be logged only");
    return null;
  }

  try {
    const { Resend } = await import("resend");
    resendInstance = new Resend(apiKey);
    logger.info("Resend client initialized", { keyPrefix: apiKey.slice(0, 8) + "..." });
    return resendInstance;
  } catch (err) {
    logger.error("Failed to initialize Resend", { error: (err as Error).message });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const DEFAULT_FROM = "ReachPilot <onboarding@resend.dev>";

/**
 * Send an email via Resend. Falls back to logging the email when no
 * RESEND_API_KEY is configured (useful in development).
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const { to, subject, html, text } = options;
  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;

  const resend = await getResend();

  if (!resend) {
    logger.warn("EMAIL NOT SENT (Resend not available)", {
      to,
      subject,
      from,
      hasApiKey: !!process.env.RESEND_API_KEY,
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
