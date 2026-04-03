import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

const rpID = process.env.NEXT_PUBLIC_RP_ID || "localhost";

export async function POST() {
  try {
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
    });

    // Store the challenge using a unique identifier
    const challengeId = `webauthn-auth-${options.challenge}`;
    await prisma.verificationToken.create({
      data: {
        identifier: challengeId,
        token: options.challenge,
        expires: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      },
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error("[passkey/authenticate] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate authentication options" },
      { status: 500 },
    );
  }
}
