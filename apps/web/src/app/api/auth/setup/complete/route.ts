import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const setupSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(200),
  password: z.string().min(8).max(128),
  timezone: z.string().max(100).optional(),
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

  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors, code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const { token, name, password, timezone } = parsed.data;

  const verification = await prisma.emailVerification.findUnique({
    where: { token },
    include: {
      user: { select: { id: true, email: true, setupComplete: true } },
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

  const hashedPassword = await bcrypt.hash(password, 12);

  // Update user and mark verification as used in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: {
        name,
        password: hashedPassword,
        status: "ACTIVE",
        emailVerified: new Date(),
        setupComplete: true,
        onboardingComplete: false,
        timezone: timezone ?? "UTC",
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
      action: "user.setup_complete",
      entityType: "User",
      entityId: verification.userId,
      after: {
        email: verification.user.email,
        name,
        timezone: timezone ?? "UTC",
      },
    },
  });

  return NextResponse.json({
    data: { success: true, email: verification.user.email },
  });
}
