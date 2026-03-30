import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";
import { inviteMemberSchema, checkPlanLimit } from "@adpilot/shared";
import { randomBytes } from "crypto";

// GET /api/organizations/[orgId]/invitations — list pending
export const GET = withErrorHandler(withRole("ADMIN", async (req, context) => {
  const orgId = (await context.params).orgId!;
  if (orgId !== req.orgId) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN", statusCode: 403 }, { status: 403 });
  }

  const invitations = await prisma.invitation.findMany({
    where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}));

// POST /api/organizations/[orgId]/invitations — invite member
export const POST = withErrorHandler(withRole("ADMIN", async (req, context) => {
  const orgId = (await context.params).orgId!;
  if (orgId !== req.orgId) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN", statusCode: 403 }, { status: 403 });
  }
  const body = await req.json();
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Check plan limit
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    return NextResponse.json({ error: "Org not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const memberCount = await prisma.membership.count({ where: { orgId } });
  const limitCheck = checkPlanLimit(org.plan, "teamMembers", {
    platformConnections: 0,
    postsThisMonth: 0,
    teamMembers: memberCount,
  });
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.reason, code: "PLAN_LIMIT", statusCode: 403, upgradeRequired: limitCheck.upgradeRequired },
      { status: 403 }
    );
  }

  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: { userId_orgId: { userId: existingUser.id, orgId } },
    });
    if (existingMembership) {
      return NextResponse.json({ error: "Already a member", code: "ALREADY_MEMBER", statusCode: 409 }, { status: 409 });
    }
  }

  // Create invitation
  const token = randomBytes(32).toString("hex");
  const invitation = await prisma.invitation.create({
    data: {
      orgId,
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      invitedBy: req.userId,
    },
  });

  // TODO: Send invitation email via Resend (will be implemented with email:send queue)

  await prisma.auditLog.create({
    data: {
      orgId,
      userId: req.userId,
      action: "INVITE_MEMBER",
      entityType: "Invitation",
      entityId: invitation.id,
      after: { email: parsed.data.email, role: parsed.data.role },
    },
  });

  return NextResponse.json(invitation, { status: 201 });
}));
