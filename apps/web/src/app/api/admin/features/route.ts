import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { z } from "zod";

const createSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  enabled: z.boolean().default(false),
  enabledForTiers: z.array(z.enum(["FREE", "PRO", "AGENCY"])).default([]),
  enabledForOrgs: z.array(z.string()).default([]),
});

export async function GET() {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
  });

  return NextResponse.json({ flags });
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

  const existing = await prisma.featureFlag.findUnique({
    where: { key: parsed.data.key },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A feature flag with this key already exists" },
      { status: 409 },
    );
  }

  const flag = await prisma.featureFlag.create({
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "FEATURE_FLAG_CREATED",
      entityType: "FeatureFlag",
      entityId: flag.id,
      after: JSON.parse(JSON.stringify(parsed.data)),
    },
  });

  return NextResponse.json({ flag }, { status: 201 });
}
