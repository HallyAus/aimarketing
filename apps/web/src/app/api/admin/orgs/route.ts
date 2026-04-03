import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { systemRole: true },
  });

  if (!user || (user.systemRole !== "ADMIN" && user.systemRole !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search") ?? "";
  const plan = searchParams.get("plan") ?? "ALL";
  const status = searchParams.get("status") ?? "ALL";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 25;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { deletedAt: null };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const validPlans = ["FREE", "PRO", "AGENCY"];
  if (plan !== "ALL" && validPlans.includes(plan)) {
    where.plan = plan;
  }

  const validStatuses = ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "UNPAID", "INCOMPLETE", "PAUSED"];
  if (status !== "ALL" && validStatuses.includes(status)) {
    where.subscriptionStatus = status;
  }

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        subscriptionStatus: true,
        billingCycle: true,
        postsUsedThisMonth: true,
        maxPostsPerMonth: true,
        createdAt: true,
        _count: {
          select: {
            memberships: true,
            platformConnections: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.organization.count({ where }),
  ]);

  return NextResponse.json({
    orgs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
