import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  type: z.enum(["INFO", "WARNING", "MAINTENANCE", "FEATURE"]).default("INFO"),
  isActive: z.boolean().default(true),
  showFrom: z.string().nullable().optional(),
  showUntil: z.string().nullable().optional(),
  targetTiers: z.array(z.enum(["FREE", "PRO", "AGENCY"])).default([]),
});

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ announcements });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      type: parsed.data.type,
      isActive: parsed.data.isActive,
      showFrom: parsed.data.showFrom ? new Date(parsed.data.showFrom) : null,
      showUntil: parsed.data.showUntil ? new Date(parsed.data.showUntil) : null,
      targetTiers: parsed.data.targetTiers,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "ANNOUNCEMENT_CREATED",
      entityType: "Announcement",
      entityId: announcement.id,
      after: { title: parsed.data.title, type: parsed.data.type },
    },
  });

  return NextResponse.json({ announcement }, { status: 201 });
}
