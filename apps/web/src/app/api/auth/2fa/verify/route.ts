import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TOTP, Secret } from "otpauth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";

const verifySchema = z.object({
  code: z.string().min(6).max(8),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code } = verifySchema.parse(body);

    const userId = session.user.id;
    const userEmail = session.user.email;

    const twoFactor = await prisma.twoFactorSecret.findUnique({
      where: { userId },
    });

    if (!twoFactor) {
      return NextResponse.json(
        { error: "Two-factor authentication is not set up" },
        { status: 400 },
      );
    }

    // Try TOTP code first
    const totp = new TOTP({
      issuer: "AdPilot",
      label: userEmail ?? "",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(twoFactor.secret),
    });

    const delta = totp.validate({ token: code, window: 1 });
    let isValid = delta !== null;

    // If TOTP didn't work, try backup codes
    if (!isValid && code.length === 8) {
      for (let i = 0; i < twoFactor.backupCodes.length; i++) {
        const storedCode = twoFactor.backupCodes[i];
        if (!storedCode) continue;
        const match = await bcrypt.compare(code, storedCode);
        if (match) {
          isValid = true;
          // Remove the used backup code
          const updatedCodes = [...twoFactor.backupCodes];
          updatedCodes.splice(i, 1);
          await prisma.twoFactorSecret.update({
            where: { userId },
            data: { backupCodes: updatedCodes },
          });
          break;
        }
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // If this is the initial setup verification, mark as verified
    if (!twoFactor.verified) {
      await prisma.twoFactorSecret.update({
        where: { userId },
        data: { verified: true, enabledAt: new Date() },
      });
    }

    // Update the JWT to mark 2FA as verified by encoding a new token
    // The client should refresh the session after this call
    const response = NextResponse.json({ success: true, verified: true });

    // Set a cookie that the middleware can read to allow access while session refreshes
    // HMAC-sign the userId to prevent tampering
    const jwtSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
    const hmac = crypto.createHmac("sha256", jwtSecret).update(userId).digest("hex");
    response.cookies.set("__2fa-verified", `${userId}.${hmac}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60, // 1 minute - just enough to refresh the session
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid code format" },
        { status: 400 },
      );
    }
    console.error("[2fa/verify] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 },
    );
  }
}
