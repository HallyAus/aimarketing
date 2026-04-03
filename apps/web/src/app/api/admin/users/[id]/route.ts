import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  timezone: z.string().min(1).max(100).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED", "PENDING_VERIFICATION", "DEACTIVATED"]).optional(),
  systemRole: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          organization: {
            select: { id: true, name: true, plan: true, slug: true, subscriptionStatus: true },
          },
        },
      },
      sessions: {
        select: { id: true, expires: true },
        orderBy: { expires: "desc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  // Strip password from response
  const { password: _pw, passwordResetToken: _prt, passwordResetExpires: _pre, ...safeUser } = user;

  return NextResponse.json({ data: safeUser });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors, code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, timezone: true, status: true, systemRole: true } });
  if (!existing) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      email: true,
      name: true,
      timezone: true,
      status: true,
      systemRole: true,
    },
  });

  // Write audit log
  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "user.updated",
      entityType: "User",
      entityId: id,
      before: JSON.parse(JSON.stringify(existing)),
      after: JSON.parse(JSON.stringify(parsed.data)),
    },
  });

  return NextResponse.json({ data: updated });
}

// DELETE /api/admin/users/[id] — permanently delete a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if ("status" in authResult) return authResult;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Protect permanent super admins
  const { isPermanentSuperAdmin } = await import("@/lib/constants/super-admins");
  if (isPermanentSuperAdmin(user.email)) {
    return NextResponse.json(
      { error: "This account cannot be deleted", code: "PERMANENT_SUPER_ADMIN" },
      { status: 403 },
    );
  }

  // Delete (cascade will handle related records)
  await prisma.user.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user?.id,
      action: "admin.user_deleted",
      entityType: "User",
      entityId: id,
      after: { deletedEmail: user.email, deletedName: user.name } as never,
    },
  });

  return NextResponse.json({ data: { deleted: true } });
}
