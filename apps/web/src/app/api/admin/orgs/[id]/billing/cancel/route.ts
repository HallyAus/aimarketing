import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelSubscription } from "@/lib/stripe-admin";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, systemRole: true },
  });

  if (!user || (user.systemRole !== "ADMIN" && user.systemRole !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const atPeriodEnd = body.atPeriodEnd !== false; // default true

  try {
    await cancelSubscription(id, atPeriodEnd);

    await prisma.auditLog.create({
      data: {
        orgId: id,
        userId: user.id,
        action: "SUBSCRIPTION_CANCELED_BY_ADMIN",
        entityType: "Organization",
        entityId: id,
        after: { atPeriodEnd },
      },
    });

    return NextResponse.json({ success: true, atPeriodEnd });
  } catch (err) {
    console.error("[cancel-subscription] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
