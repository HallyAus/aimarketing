import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { isPermanentSuperAdmin } from "@/lib/constants/super-admins";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, status: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  if (isPermanentSuperAdmin(user.email)) {
    return NextResponse.json(
      { error: "Cannot ban a permanent super admin", code: "PERMANENT_SUPER_ADMIN" },
      { status: 403 },
    );
  }

  if (user.status === "BANNED") {
    return NextResponse.json(
      { error: "User is already banned", code: "ALREADY_BANNED" },
      { status: 400 },
    );
  }

  // Ban the user and invalidate all sessions
  const [updated] = await Promise.all([
    prisma.user.update({
      where: { id },
      data: { status: "BANNED" },
      select: { id: true, email: true, status: true },
    }),
    prisma.session.deleteMany({ where: { userId: id } }),
  ]);

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "user.banned",
      entityType: "User",
      entityId: id,
      before: { status: user.status },
      after: { status: "BANNED" },
    },
  });

  return NextResponse.json({ data: updated });
}
