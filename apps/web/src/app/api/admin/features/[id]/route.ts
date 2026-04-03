import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { z } from "zod";

const updateSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores").optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  enabled: z.boolean().optional(),
  enabledForTiers: z.array(z.enum(["FREE", "PRO", "AGENCY"])).optional(),
  enabledForOrgs: z.array(z.string()).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await context.params;
  const flag = await prisma.featureFlag.findUnique({ where: { id } });
  if (!flag) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ flag });
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

  const existing = await prisma.featureFlag.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check key uniqueness if key is changing
  if (parsed.data.key && parsed.data.key !== existing.key) {
    const duplicate = await prisma.featureFlag.findUnique({
      where: { key: parsed.data.key },
    });
    if (duplicate) {
      return NextResponse.json(
        { error: "A feature flag with this key already exists" },
        { status: 409 },
      );
    }
  }

  const flag = await prisma.featureFlag.update({
    where: { id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "FEATURE_FLAG_UPDATED",
      entityType: "FeatureFlag",
      entityId: flag.id,
      before: {
        key: existing.key,
        name: existing.name,
        enabled: existing.enabled,
        enabledForTiers: existing.enabledForTiers,
        enabledForOrgs: existing.enabledForOrgs,
      },
      after: parsed.data as unknown as Record<string, string>,
    },
  });

  return NextResponse.json({ flag });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const { id } = await context.params;
  const existing = await prisma.featureFlag.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.featureFlag.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "FEATURE_FLAG_DELETED",
      entityType: "FeatureFlag",
      entityId: id,
      before: {
        key: existing.key,
        name: existing.name,
      },
    },
  });

  return NextResponse.json({ success: true });
}
