import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import crypto from "crypto";

const rpID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.response?.clientDataJSON) {
      return NextResponse.json(
        { error: "Invalid authentication response" },
        { status: 400 },
      );
    }

    // Decode the clientDataJSON to get the challenge
    const clientDataJSON = JSON.parse(
      Buffer.from(body.response.clientDataJSON, "base64url").toString("utf-8"),
    );
    const challenge = clientDataJSON.challenge;

    // Retrieve the stored challenge
    const challengeId = `webauthn-auth-${challenge}`;
    const storedChallenge = await prisma.verificationToken.findFirst({
      where: { identifier: challengeId },
    });

    if (!storedChallenge) {
      return NextResponse.json(
        { error: "No authentication challenge found. Please try again." },
        { status: 400 },
      );
    }

    // Find the authenticator by credential ID
    const credentialID = body.id;
    const authenticator = await prisma.authenticator.findUnique({
      where: { credentialID },
      include: { user: true },
    });

    if (!authenticator) {
      return NextResponse.json(
        { error: "Authenticator not found" },
        { status: 400 },
      );
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: storedChallenge.token,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(authenticator.credentialID, "base64url"),
        credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, "base64url"),
        counter: authenticator.counter,
        transports: authenticator.transports
          ? (authenticator.transports.split(",") as any[])
          : undefined,
      },
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

    if (!verification.verified) {
      return NextResponse.json(
        { error: "Authentication verification failed" },
        { status: 400 },
      );
    }

    // Update the counter
    await prisma.authenticator.update({
      where: { credentialID: authenticator.credentialID },
      data: { counter: verification.authenticationInfo.newCounter },
    });

    // Create a temporary session token that the credentials provider can use
    const passkeyToken = crypto.randomUUID();
    await prisma.session.create({
      data: {
        sessionToken: passkeyToken,
        userId: authenticator.userId,
        expires: new Date(Date.now() + 60 * 1000), // 1 minute
      },
    });

    return NextResponse.json({
      verified: true,
      passkeyToken,
      user: {
        id: authenticator.user.id,
        email: authenticator.user.email,
        name: authenticator.user.name,
      },
    });
  } catch (error) {
    console.error("[passkey/authenticate/verify] Error:", error);
    return NextResponse.json(
      { error: "Failed to verify authentication" },
      { status: 500 },
    );
  }
}
