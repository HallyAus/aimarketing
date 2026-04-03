import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { isPermanentSuperAdmin } from "@/lib/constants/super-admins";
import { z } from "zod";

const changeRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  // Only SUPER_ADMIN can change system roles
  if (authResult.user.systemRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only super admins can change system roles", code: "FORBIDDEN" },
      { status: 403 },
    );
  }

  // Cannot change own role
  if (id === authResult.user.id) {
    return NextResponse.json(
      { error: "Cannot change your own role", code: "SELF_CHANGE" },
      { status: 400 },
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

  const parsed = changeRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors, code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const { role: newRole } = parsed.data;

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, systemRole: true },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  // Cannot demote a permanent super admin
  if (isPermanentSuperAdmin(targetUser.email) && newRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Cannot demote a permanent super admin", code: "PERMANENT_SUPER_ADMIN" },
      { status: 403 },
    );
  }

  // Only permanent super admins can promote to SUPER_ADMIN
  if (newRole === "SUPER_ADMIN") {
    const currentAdmin = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: { email: true },
    });
    if (!currentAdmin || !isPermanentSuperAdmin(currentAdmin.email)) {
      return NextResponse.json(
        {
          error: "Only permanent super admins can promote to SUPER_ADMIN",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }
  }

  // No-op check
  if (targetUser.systemRole === newRole) {
    return NextResponse.json(
      { error: "User already has this role", code: "NO_CHANGE" },
      { status: 400 },
    );
  }

  const previousRole = targetUser.systemRole;

  await prisma.user.update({
    where: { id },
    data: { systemRole: newRole },
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "user.role_changed",
      entityType: "User",
      entityId: id,
      before: { systemRole: previousRole },
      after: { systemRole: newRole },
    },
  });

  return NextResponse.json({
    data: {
      id: targetUser.id,
      previousRole,
      newRole,
    },
  });
}
