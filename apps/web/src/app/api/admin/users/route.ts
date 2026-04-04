import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { z } from "zod";
import type { Prisma } from "@reachpilot/db";

const querySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "SUSPENDED", "BANNED", "PENDING_VERIFICATION", "DEACTIVATED"]).optional(),
  role: z.enum(["ALL", "USER", "ADMIN", "SUPER_ADMIN"]).optional(),
  plan: z.enum(["ALL", "FREE", "PRO", "AGENCY"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const url = req.nextUrl;
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    role: url.searchParams.get("role") ?? undefined,
    plan: url.searchParams.get("plan") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors, code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const { q, status, role, plan, page, pageSize } = parsed.data;

  const where: Prisma.UserWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status && status !== "ALL") {
    where.status = status as Prisma.EnumUserStatusFilter;
  }

  if (role && role !== "ALL") {
    where.systemRole = role as Prisma.EnumSystemRoleFilter;
  }

  if (plan && plan !== "ALL") {
    where.memberships = {
      some: {
        organization: { plan: plan as "FREE" | "PRO" | "AGENCY", deletedAt: null },
      },
    };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        systemRole: true,
        timezone: true,
        lastLoginAt: true,
        loginCount: true,
        createdAt: true,
        memberships: {
          select: {
            role: true,
            organization: { select: { id: true, name: true, plan: true } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    data: users,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
