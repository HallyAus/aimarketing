import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@adpilot/db";
import { updateMemberRoleSchema } from "@adpilot/shared";
import { ZodValidationError } from "@/lib/api-handler";

// GET /api/organizations/[orgId]/members
export const GET = withRole("VIEWER", async (req, context) => {
  const { orgId } = await context.params;

  const members = await prisma.membership.findMany({
    where: { orgId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
});

// PATCH /api/organizations/[orgId]/members — update member role
export const PATCH = withRole("ADMIN", async (req, context) => {
  const { orgId } = await context.params;
  const body = await req.json();
  const { memberId, ...roleData } = body;
  const parsed = updateMemberRoleSchema.safeParse(roleData);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Prevent changing OWNER role
  const target = await prisma.membership.findUnique({ where: { id: memberId } });
  if (!target || target.orgId !== orgId) {
    return NextResponse.json({ error: "Member not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot change owner role", code: "FORBIDDEN", statusCode: 403 }, { status: 403 });
  }

  const updated = await prisma.membership.update({
    where: { id: memberId },
    data: { role: parsed.data.role },
  });

  return NextResponse.json(updated);
});

// DELETE /api/organizations/[orgId]/members — remove member
export const DELETE = withRole("ADMIN", async (req, context) => {
  const { orgId } = await context.params;
  const { memberId } = await req.json();

  const target = await prisma.membership.findUnique({ where: { id: memberId } });
  if (!target || target.orgId !== orgId) {
    return NextResponse.json({ error: "Member not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove owner", code: "FORBIDDEN", statusCode: 403 }, { status: 403 });
  }

  await prisma.membership.delete({ where: { id: memberId } });

  await prisma.auditLog.create({
    data: {
      orgId,
      userId: req.userId,
      action: "REMOVE_MEMBER",
      entityType: "Membership",
      entityId: memberId,
    },
  });

  return NextResponse.json({ success: true });
});
