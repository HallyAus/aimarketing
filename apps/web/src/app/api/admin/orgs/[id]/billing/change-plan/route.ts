import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { changePlan } from "@/lib/stripe-admin";

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
  const body = await req.json();
  const { plan } = body;

  if (!plan || !["FREE", "PRO", "AGENCY"].includes(plan)) {
    return NextResponse.json(
      { error: "Invalid plan. Must be FREE, PRO, or AGENCY." },
      { status: 400 }
    );
  }

  try {
    await changePlan(id, plan);
    return NextResponse.json({ success: true, plan });
  } catch (err) {
    console.error("[change-plan] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to change plan" },
      { status: 500 }
    );
  }
}
