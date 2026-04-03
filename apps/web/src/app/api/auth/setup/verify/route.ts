import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token is required", code: "MISSING_TOKEN" },
      { status: 400 },
    );
  }

  const verification = await prisma.emailVerification.findUnique({
    where: { token },
    include: {
      user: { select: { id: true, email: true, name: true, setupComplete: true } },
    },
  });

  if (!verification) {
    return NextResponse.json(
      { error: "Invalid setup token", code: "INVALID_TOKEN" },
      { status: 404 },
    );
  }

  if (verification.type !== "PASSWORD_SETUP") {
    return NextResponse.json(
      { error: "Invalid token type", code: "WRONG_TYPE" },
      { status: 400 },
    );
  }

  if (verification.usedAt) {
    return NextResponse.json(
      { error: "This setup link has already been used", code: "ALREADY_USED" },
      { status: 400 },
    );
  }

  if (verification.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This setup link has expired", code: "EXPIRED" },
      { status: 400 },
    );
  }

  if (verification.user.setupComplete) {
    return NextResponse.json(
      { error: "Account setup is already complete", code: "ALREADY_SETUP" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    data: {
      userId: verification.user.id,
      email: verification.user.email,
      name: verification.user.name,
    },
  });
}
