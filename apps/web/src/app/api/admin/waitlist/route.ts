import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
  converted: z.enum(["yes", "no"]).optional(),
  plan: z.enum(["FREE", "PRO", "AGENCY"]).optional(),
});

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    page: url.searchParams.get("page") || undefined,
    pageSize: url.searchParams.get("pageSize") || undefined,
    converted: url.searchParams.get("converted") || undefined,
    plan: url.searchParams.get("plan") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { page, pageSize, converted, plan } = parsed.data;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (converted === "yes") {
    where.convertedAt = { not: null };
  } else if (converted === "no") {
    where.convertedAt = null;
  }
  if (plan) {
    where.planInterest = plan;
  }

  const [entries, total] = await Promise.all([
    prisma.waitlistEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.waitlistEntry.count({ where }),
  ]);

  return NextResponse.json({
    entries,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
