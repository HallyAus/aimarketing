import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { updateMemberRoleSchema } from "@reachpilot/shared";

// GET /api/organizations/[orgId]/members
export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const orgId = (await context.params).orgId!;
  if (orgId !== req.orgId) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN", statusCode: 403 }, { status: 403 });
  }

  const members = await prisma.membership.findMany({
    where: { orgId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}));

// PATCH /api/organizations/[orgId]/members — update member role
export const PATCH = withErrorHandler(withRole("ADMIN", async (req, context) => {
  const orgId = (await context.params).orgId!;
  if (orgId !== req.orgId) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN", statusCode: 403 }, { status: 403 });
  }
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
}));

// DELETE /api/organizations/[orgId]/members?memberId=xxx — remove member
export const DELETE = withErrorHandler(withRole("ADMIN", async (req, context) => {
  const orgId = (await context.params).orgId!;
  if (orgId !== req.orgId) {
    return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN", statusCode: 403 }, { status: 403 });
  }
  const url = new URL(req.url);
  const memberId = url.searchParams.get("memberId");
  if (!memberId) {
    return NextResponse.json({ error: "memberId query parameter is required", code: "BAD_REQUEST", statusCode: 400 }, { status: 400 });
  }

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
}));
