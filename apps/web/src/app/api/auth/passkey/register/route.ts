import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateRegistrationOptions } from "@simplewebauthn/server";

const rpName = "ReachPilot";
const rpID = process.env.NEXT_PUBLIC_RP_ID || "localhost";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email ?? "";

    // Get existing authenticators for this user
    const existingAuthenticators = await prisma.authenticator.findMany({
      where: { userId },
    });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId,
      userName: userEmail,
      userDisplayName: session.user.name ?? userEmail,
      attestationType: "none",
      excludeCredentials: existingAuthenticators.map((auth) => ({
        id: Buffer.from(auth.credentialID, "base64url"),
        type: "public-key",
        transports: auth.transports
          ? (auth.transports.split(",") as AuthenticatorTransport[])
          : undefined,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Store the challenge temporarily in a session record
    await prisma.session.create({
      data: {
        sessionToken: `webauthn-reg-${userId}`,
        userId,
        expires: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      },
    });

    // Store challenge in a way we can retrieve it
    // Using a simple approach: store in a temp verification token
    await prisma.verificationToken.create({
      data: {
        identifier: `webauthn-reg-${userId}`,
        token: options.challenge,
        expires: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error("[passkey/register] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate registration options" },
      { status: 500 },
    );
  }
}

type AuthenticatorTransport = "ble" | "hybrid" | "internal" | "nfc" | "usb";
