import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const verifySchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors, code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const { token } = parsed.data;

  const verification = await prisma.emailVerification.findUnique({
    where: { token },
    include: {
      user: { select: { id: true, email: true, emailVerified: true } },
    },
  });

  if (!verification) {
    return NextResponse.json(
      { error: "Invalid verification token", code: "INVALID_TOKEN" },
      { status: 404 },
    );
  }

  if (verification.type !== "EMAIL_VERIFICATION") {
    return NextResponse.json(
      { error: "Invalid token type", code: "WRONG_TYPE" },
      { status: 400 },
    );
  }

  if (verification.usedAt) {
    return NextResponse.json(
      { error: "This link has already been used", code: "ALREADY_USED" },
      { status: 400 },
    );
  }

  if (verification.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This verification link has expired", code: "EXPIRED" },
      { status: 400 },
    );
  }

  // Mark email as verified
  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: {
        emailVerified: new Date(),
        status: "ACTIVE",
      },
    }),
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: verification.userId,
      action: "user.email_verified",
      entityType: "User",
      entityId: verification.userId,
      after: { email: verification.user.email },
    },
  });

  return NextResponse.json({
    data: { success: true, email: verification.user.email },
  });
}
