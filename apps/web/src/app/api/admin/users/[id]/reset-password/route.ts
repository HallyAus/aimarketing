import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { randomBytes } from "crypto";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  // Generate a secure reset token (valid for 1 hour)
  const resetToken = randomBytes(32).toString("hex");
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "user.password_reset_initiated",
      entityType: "User",
      entityId: id,
    },
  });

  return NextResponse.json({
    data: {
      resetToken,
      expiresAt: resetExpires.toISOString(),
      message: `Password reset token generated for ${user.email}. Expires in 1 hour.`,
    },
  });
}
