import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      // Always return success to avoid email enumeration
      return NextResponse.json({ success: true });
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to avoid email enumeration
    if (!user || !user.password) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600_000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    // Send email via Resend if configured
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password/${token}`;

      await resend.emails.send({
        from: process.env.EMAIL_FROM || "AdPilot <onboarding@resend.dev>",
        to: email,
        subject: "Reset your AdPilot password",
        html: `
          <h2>Reset your password</h2>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:white;text-decoration:none;border-radius:8px;">Reset Password</a>
          <p style="margin-top:16px;color:#666;">If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    } else {
      console.warn(
        "RESEND_API_KEY not configured — password reset email not sent. Configure RESEND_API_KEY to enable.",
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: true }); // Don't leak errors
  }
}
