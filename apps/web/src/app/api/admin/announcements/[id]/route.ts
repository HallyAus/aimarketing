import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(5000).optional(),
  type: z.enum(["INFO", "WARNING", "MAINTENANCE", "FEATURE"]).optional(),
  isActive: z.boolean().optional(),
  showFrom: z.string().nullable().optional(),
  showUntil: z.string().nullable().optional(),
  targetTiers: z.array(z.enum(["FREE", "PRO", "AGENCY"])).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.showFrom !== undefined) {
    data.showFrom = parsed.data.showFrom ? new Date(parsed.data.showFrom) : null;
  }
  if (parsed.data.showUntil !== undefined) {
    data.showUntil = parsed.data.showUntil ? new Date(parsed.data.showUntil) : null;
  }

  const announcement = await prisma.announcement.update({
    where: { id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "ANNOUNCEMENT_UPDATED",
      entityType: "Announcement",
      entityId: id,
      before: { title: existing.title, isActive: existing.isActive },
      after: JSON.parse(JSON.stringify(parsed.data)),
    },
  });

  return NextResponse.json({ announcement });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await context.params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.announcement.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "ANNOUNCEMENT_DELETED",
      entityType: "Announcement",
      entityId: id,
      before: { title: existing.title },
    },
  });

  return NextResponse.json({ success: true });
}
