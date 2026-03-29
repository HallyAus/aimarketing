import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";
import { updateOrgSchema } from "@adpilot/shared";

// GET /api/organizations/[orgId]
export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const orgId = (await context.params).orgId!;

  const org = await prisma.organization.findUnique({
    where: { id: orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      billingEmail: true,
      createdAt: true,
      _count: {
        select: {
          memberships: true,
          platformConnections: true,
          campaigns: true,
        },
      },
    },
  });

  if (!org) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  return NextResponse.json(org);
}));

// PATCH /api/organizations/[orgId]
export const PATCH = withErrorHandler(withRole("OWNER", async (req, context) => {
  const orgId = (await context.params).orgId!;
  const body = await req.json();
  const parsed = updateOrgSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const before = await prisma.organization.findUnique({ where: { id: orgId } });

  const org = await prisma.organization.update({
    where: { id: orgId },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      userId: req.userId,
      action: "UPDATE",
      entityType: "Organization",
      entityId: orgId,
      before: before ? { name: before.name, billingEmail: before.billingEmail } : undefined,
      after: parsed.data as Record<string, string>,
    },
  });

  return NextResponse.json(org);
}));

// DELETE /api/organizations/[orgId] — soft delete
export const DELETE = withErrorHandler(withRole("OWNER", async (req, context) => {
  const orgId = (await context.params).orgId!;

  await prisma.organization.update({
    where: { id: orgId },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      userId: req.userId,
      action: "DELETE",
      entityType: "Organization",
      entityId: orgId,
    },
  });

  return NextResponse.json({ success: true });
}));
