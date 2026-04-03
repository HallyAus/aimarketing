import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

const createInviteSchema = z.object({
  email: z.string().email().max(255),
  role: z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]).default("VIEWER"),
  message: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { orgId } = await params;

  // Verify requester is OWNER or ADMIN of the org
  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId } },
    select: { role: true },
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return NextResponse.json(
      { error: "You must be an owner or admin of this organization", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const parsed = createInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors, code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const { email, role, message } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Check member limits
  const org = await prisma.organization.findUnique({
    where: { id: orgId, deletedAt: null },
    select: { id: true, name: true, maxUsers: true },
  });

  if (!org) {
    return NextResponse.json(
      { error: "Organization not found", code: "ORG_NOT_FOUND" },
      { status: 404 },
    );
  }

  const memberCount = await prisma.membership.count({ where: { orgId } });
  const pendingInviteCount = await prisma.invitation.count({
    where: { orgId, status: "PENDING" },
  });

  if (memberCount + pendingInviteCount >= org.maxUsers) {
    return NextResponse.json(
      {
        error: `Organization has reached its member limit (${org.maxUsers})`,
        code: "MEMBER_LIMIT",
      },
      { status: 400 },
    );
  }

  // Check not already a member
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_orgId: { userId: existingUser.id, orgId },
      },
      select: { id: true },
    });
    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this organization", code: "ALREADY_MEMBER" },
        { status: 409 },
      );
    }
  }

  // Check no existing pending invite
  const existingInvite = await prisma.invitation.findFirst({
    where: { orgId, email: normalizedEmail, status: "PENDING" },
    select: { id: true },
  });

  if (existingInvite) {
    return NextResponse.json(
      { error: "A pending invitation already exists for this email", code: "DUPLICATE_INVITE" },
      { status: 409 },
    );
  }

  // Create invitation with hashed token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.create({
    data: {
      orgId,
      email: normalizedEmail,
      role,
      token: hashedToken,
      expiresAt,
      invitedBy: session.user.id,
      message: message ?? null,
    },
    select: { id: true, email: true, role: true, expiresAt: true },
  });

  // Send invite email
  try {
    const { sendEmail } = await import("@/lib/email");
    const { teamInviteEmail } = await import("@/lib/email-templates");
    const emailContent = teamInviteEmail({
      orgName: org.name,
      role,
      inviterName: session.user.name ?? session.user.email ?? "A team member",
      token: rawToken,
      message,
    });
    await sendEmail({
      to: normalizedEmail,
      ...emailContent,
    });
  } catch {
    console.error("Failed to send invite email to", normalizedEmail);
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      orgId,
      action: "invitation.created",
      entityType: "Invitation",
      entityId: invitation.id,
      after: {
        email: normalizedEmail,
        role,
        expiresAt: expiresAt.toISOString(),
      },
    },
  });

  return NextResponse.json({ data: invitation }, { status: 201 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { orgId } = await params;

  // Verify requester is member of the org
  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId } },
    select: { role: true },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Forbidden", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  const status = req.nextUrl.searchParams.get("status");

  const invitations = await prisma.invitation.findMany({
    where: {
      orgId,
      ...(status && status !== "ALL" ? { status: status as "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED" } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      inviter: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ data: invitations });
}
