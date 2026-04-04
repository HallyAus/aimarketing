// ---------------------------------------------------------------------------
// Branded HTML email templates for ReachPilot
// ---------------------------------------------------------------------------

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.reachpilot.com";
const ACCENT = "#7c3aed";

// ---------------------------------------------------------------------------
// Shared layout
// ---------------------------------------------------------------------------

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr><td style="background:${ACCENT};padding:24px 32px">
          <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-.3px">ReachPilot</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">${body}</td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid #e4e4e7;font-size:12px;color:#a1a1aa;text-align:center">
          &copy; ${new Date().getFullYear()} ReachPilot. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td>
    <a href="${href}" style="display:inline-block;padding:12px 28px;background:${ACCENT};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">${label}</a>
  </td></tr></table>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#27272a">${text}</p>`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

interface AdminCreatedUserInput {
  name: string;
  email: string;
  token: string;
  adminName: string;
  orgName?: string;
}

export function adminCreatedUserEmail({
  name,
  email,
  token,
  adminName,
  orgName,
}: AdminCreatedUserInput) {
  const setupUrl = `${APP_URL}/auth/setup?token=${token}`;
  const greeting = name ? `Hi ${name},` : "Hi,";
  const orgLine = orgName ? ` to <strong>${orgName}</strong>` : "";

  const html = layout(
    paragraph(`${greeting}`) +
      paragraph(
        `${adminName} has created an account for you${orgLine} on ReachPilot. To get started, set up your password using the link below.`,
      ) +
      button("Set Up Your Account", setupUrl) +
      paragraph(
        `Your email address: <strong>${email}</strong>`,
      ) +
      paragraph(
        `<span style="font-size:13px;color:#71717a">This link expires in 24 hours. If you did not expect this, you can safely ignore this email.</span>`,
      ),
  );

  const text = `${greeting}\n\n${adminName} has created an ReachPilot account for you${orgName ? ` at ${orgName}` : ""}. Set up your password: ${setupUrl}\n\nEmail: ${email}\n\nThis link expires in 24 hours.`;

  return {
    subject: `You have been invited to ReachPilot${orgName ? ` — ${orgName}` : ""}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------------

interface TeamInviteInput {
  inviterName: string;
  orgName: string;
  role: string;
  token: string;
  message?: string;
}

export function teamInviteEmail({
  inviterName,
  orgName,
  role,
  token,
  message,
}: TeamInviteInput) {
  const inviteUrl = `${APP_URL}/invite/accept?token=${token}`;

  const msgBlock = message
    ? `<div style="margin:16px 0;padding:16px;background:#f4f4f5;border-radius:8px;font-size:14px;color:#3f3f46;white-space:pre-wrap">${message}</div>`
    : "";

  const html = layout(
    paragraph(
      `<strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on ReachPilot as a <strong>${role}</strong>.`,
    ) +
      msgBlock +
      button("Accept Invitation", inviteUrl) +
      paragraph(
        `<span style="font-size:13px;color:#71717a">This invitation expires in 7 days. If you did not expect this, you can safely ignore this email.</span>`,
      ),
  );

  const text = `${inviterName} has invited you to join ${orgName} on ReachPilot as a ${role}.${message ? `\n\nMessage: ${message}` : ""}\n\nAccept: ${inviteUrl}\n\nThis invitation expires in 7 days.`;

  return {
    subject: `${inviterName} invited you to ${orgName} on ReachPilot`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------------

interface EmailVerificationInput {
  name: string;
  token: string;
}

export function emailVerificationEmail({ name, token }: EmailVerificationInput) {
  const verifyUrl = `${APP_URL}/auth/verify-email?token=${token}`;
  const greeting = name ? `Hi ${name},` : "Hi,";

  const html = layout(
    paragraph(greeting) +
      paragraph("Please verify your email address by clicking the button below.") +
      button("Verify Email", verifyUrl) +
      paragraph(
        `<span style="font-size:13px;color:#71717a">This link expires in 24 hours. If you did not request this, you can safely ignore this email.</span>`,
      ),
  );

  const text = `${greeting}\n\nVerify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`;

  return { subject: "Verify your ReachPilot email", html, text };
}

// ---------------------------------------------------------------------------

interface PasswordResetInput {
  name: string;
  token: string;
}

export function passwordResetEmail({ name, token }: PasswordResetInput) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;
  const greeting = name ? `Hi ${name},` : "Hi,";

  const html = layout(
    paragraph(greeting) +
      paragraph(
        "We received a request to reset your password. Click the button below to choose a new one.",
      ) +
      button("Reset Password", resetUrl) +
      paragraph(
        `<span style="font-size:13px;color:#71717a">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</span>`,
      ),
  );

  const text = `${greeting}\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.`;

  return { subject: "Reset your ReachPilot password", html, text };
}

// ---------------------------------------------------------------------------

interface InviteAcceptedInput {
  inviterName: string;
  acceptedName: string;
  acceptedEmail: string;
  orgName: string;
}

export function inviteAcceptedNotification({
  inviterName,
  acceptedName,
  acceptedEmail,
  orgName,
}: InviteAcceptedInput) {
  const displayName = acceptedName || acceptedEmail;
  const dashboardUrl = `${APP_URL}/dashboard`;

  const html = layout(
    paragraph(`Hi ${inviterName},`) +
      paragraph(
        `<strong>${displayName}</strong> (${acceptedEmail}) has accepted your invitation and joined <strong>${orgName}</strong>.`,
      ) +
      button("Go to Dashboard", dashboardUrl),
  );

  const text = `Hi ${inviterName},\n\n${displayName} (${acceptedEmail}) has accepted your invitation and joined ${orgName}.\n\nDashboard: ${dashboardUrl}`;

  return {
    subject: `${displayName} joined ${orgName} on ReachPilot`,
    html,
    text,
  };
}
