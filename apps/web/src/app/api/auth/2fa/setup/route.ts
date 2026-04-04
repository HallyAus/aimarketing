import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    // Check if 2FA is already enabled and verified
    const existing = await prisma.twoFactorSecret.findUnique({
      where: { userId },
    });
    if (existing?.verified) {
      return NextResponse.json(
        { error: "Two-factor authentication is already enabled" },
        { status: 400 },
      );
    }

    // Generate TOTP secret
    const secret = new Secret({ size: 20 });
    const totp = new TOTP({
      issuer: "ReachPilot",
      label: userEmail,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret,
    });
    const uri = totp.toString();
    const qrDataUrl = await QRCode.toDataURL(uri);

    // Generate 8 backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString("hex"),
    );
    const hashedCodes = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, 10)),
    );

    // Upsert the 2FA secret (not yet verified)
    await prisma.twoFactorSecret.upsert({
      where: { userId },
      update: {
        secret: secret.base32,
        backupCodes: hashedCodes,
        verified: false,
        enabledAt: null,
      },
      create: {
        userId,
        secret: secret.base32,
        backupCodes: hashedCodes,
        verified: false,
      },
    });

    return NextResponse.json({
      qrCode: qrDataUrl,
      secret: secret.base32,
      backupCodes,
    });
  } catch (error) {
    console.error("[2fa/setup] Error:", error);
    return NextResponse.json(
      { error: "Failed to set up two-factor authentication" },
      { status: 500 },
    );
  }
}
