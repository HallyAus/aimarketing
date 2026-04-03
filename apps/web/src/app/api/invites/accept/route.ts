import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const acceptSchema = z.object({
  token: z.string().min(1),
  // Fields for new user registration (optional if user exists and is logged in)
  name: z.string().min(1).max(200).optional(),
  password: z.string().min(8).max(128).optional(),
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

  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors, code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const { token, name, password, timezone } = parsed.data;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const invitation = await prisma.invitation.findUnique({
    where: { token: hashedToken },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json(
      { error: "Invalid invitation token", code: "INVALID_TOKEN" },
      { status: 404 },
    );
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json(
      { error: `Invitation has already been ${invitation.status.toLowerCase()}`, code: "NOT_PENDING" },
      { status: 400 },
    );
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json(
      { error: "Invitation has expired", code: "EXPIRED" },
      { status: 400 },
    );
  }

  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email: invitation.email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    // New user: name and password are required
    if (!name || !password) {
      return NextResponse.json(
        { error: "Name and password are required for new users", code: "MISSING_FIELDS" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user = await prisma.user.create({
      data: {
        email: invitation.email,
        name,
        password: hashedPassword,
        status: "ACTIVE",
        emailVerified: new Date(),
        setupComplete: true,
        timezone: timezone ?? "UTC",
        invitedBy: invitation.invitedBy,
      },
      select: { id: true, email: true, name: true },
    });
  }

  // Check if already a member
  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_orgId: { userId: user.id, orgId: invitation.orgId },
    },
    select: { id: true },
  });

  if (existingMembership) {
    // Mark invitation as accepted anyway
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
    return NextResponse.json(
      { error: "You are already a member of this organization", code: "ALREADY_MEMBER" },
      { status: 409 },
    );
  }

  // Create membership and update invitation in a transaction
  await prisma.$transaction([
    prisma.membership.create({
      data: {
        userId: user.id,
        orgId: invitation.orgId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        acceptedAt: new Date(),
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    }),
  ]);

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      orgId: invitation.orgId,
      action: "invitation.accepted",
      entityType: "Invitation",
      entityId: invitation.id,
      after: {
        userId: user.id,
        email: user.email,
        role: invitation.role,
        orgName: invitation.organization.name,
      },
    },
  });

  return NextResponse.json({
    data: {
      userId: user.id,
      orgId: invitation.orgId,
      orgName: invitation.organization.name,
      role: invitation.role,
      isNewUser: !!(name && password),
    },
  });
}
