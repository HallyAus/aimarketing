import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  if (user.status === "SUSPENDED") {
    return NextResponse.json(
      { error: "User is already suspended", code: "ALREADY_SUSPENDED" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: "SUSPENDED" },
    select: { id: true, email: true, status: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "user.suspended",
      entityType: "User",
      entityId: id,
      before: { status: user.status },
      after: { status: "SUSPENDED" },
    },
  });

  return NextResponse.json({ data: updated });
}
