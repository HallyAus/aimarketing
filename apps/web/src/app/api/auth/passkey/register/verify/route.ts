import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyRegistrationResponse } from "@simplewebauthn/server";

const rpID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // Retrieve the stored challenge
    const storedChallenge = await prisma.verificationToken.findFirst({
      where: { identifier: `webauthn-reg-${userId}` },
    });

    if (!storedChallenge) {
      return NextResponse.json(
        { error: "No registration challenge found. Please try again." },
        { status: 400 },
      );
    }

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: storedChallenge.token,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    // Clean up the challenge
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: storedChallenge.identifier,
          token: storedChallenge.token,
        },
      },
    });

    // Clean up temp session
    await prisma.session.deleteMany({
      where: { sessionToken: `webauthn-reg-${userId}` },
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { error: "Registration verification failed" },
        { status: 400 },
      );
    }

    const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // Store the authenticator
    const credentialIDBase64 = Buffer.from(credentialID).toString("base64url");
    const credentialPublicKeyBase64 = Buffer.from(credentialPublicKey).toString("base64url");

    await prisma.authenticator.create({
      data: {
        credentialID: credentialIDBase64,
        userId,
        providerAccountId: userId,
        credentialPublicKey: credentialPublicKeyBase64,
        counter,
        credentialDeviceType,
        credentialBackedUp,
        transports: body.response?.transports?.join(",") ?? null,
      },
    });

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("[passkey/register/verify] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify registration" },
      { status: 500 },
    );
  }
}
