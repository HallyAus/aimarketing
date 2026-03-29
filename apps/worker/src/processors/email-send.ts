import type { Job } from "bullmq";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM ?? "AdPilot <noreply@adpilot.com>";

type EmailJobData = {
  type: "invitation" | "token-expired" | "payment-failed" | "weekly-digest";
  to: string;
  data: Record<string, string>;
};

const TEMPLATES: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
  invitation: (data) => ({
    subject: `You've been invited to ${data.orgName} on AdPilot`,
    html: `<p>Hi,</p><p>You've been invited to join <strong>${data.orgName}</strong> as ${data.role}.</p><p><a href="${data.inviteUrl}">Accept Invitation</a></p><p>This link expires in 7 days.</p>`,
  }),
  "token-expired": (data) => ({
    subject: `${data.platform} connection expired — AdPilot`,
    html: `<p>Your <strong>${data.platform}</strong> connection for <strong>${data.orgName}</strong> has expired.</p><p><a href="${data.reconnectUrl}">Reconnect now</a> to continue publishing.</p>`,
  }),
  "payment-failed": (data) => ({
    subject: "Payment failed — AdPilot",
    html: `<p>We couldn't process your payment for <strong>${data.orgName}</strong>.</p><p>Please update your payment method within 3 days to avoid a plan downgrade.</p><p><a href="${data.billingUrl}">Update Payment</a></p>`,
  }),
  "weekly-digest": (data) => ({
    subject: `Weekly report — ${data.orgName} — AdPilot`,
    html: `<p>Here's your weekly summary for <strong>${data.orgName}</strong>:</p><ul><li>Posts published: ${data.postsPublished}</li><li>Total impressions: ${data.impressions}</li><li>Total engagement: ${data.engagement}</li></ul><p><a href="${data.dashboardUrl}">View Dashboard</a></p>`,
  }),
};

export async function processEmailSend(job: Job): Promise<void> {
  const { type, to, data } = job.data as EmailJobData;

  const template = TEMPLATES[type];
  if (!template) {
    console.error(`[email:send] Unknown email type: ${type}`);
    return;
  }

  const { subject, html } = template(data);

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    console.log(`[email:send] Sent ${type} email to ${to}:`, result);
  } catch (error) {
    console.error(`[email:send] Failed to send ${type} to ${to}:`, error);
    throw error; // Re-throw for BullMQ retry
  }
}
