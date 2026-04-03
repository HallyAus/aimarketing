import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/webhooks/rules — list webhook rules for current org
// Optional: ?trigger=AUTO_REPLY to filter by trigger type
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const trigger = req.nextUrl.searchParams.get("trigger");
  const where: Record<string, unknown> = { orgId: req.orgId };
  if (trigger) {
    where.trigger = trigger;
  }

  const rules = await prisma.webhookRule.findMany({
    where,
    include: { page: { select: { id: true, name: true, platform: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ data: rules });
}));

// POST /api/webhooks/rules — create a new webhook rule
export const POST = withErrorHandler(withRole("ADMIN", async (req) => {
  const { name, trigger, action, config, pageId } = await req.json();
  if (!name || !trigger || !action) {
    return NextResponse.json({ error: "name, trigger, and action are required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const rule = await prisma.webhookRule.create({
    data: {
      orgId: req.orgId,
      pageId: pageId ?? null,
      name,
      trigger,
      action,
      config: config ?? {},
      isActive: true,
    },
  });

  return NextResponse.json(rule, { status: 201 });
}));

// PATCH /api/webhooks/rules — update a webhook rule
export const PATCH = withErrorHandler(withRole("ADMIN", async (req) => {
  const { ruleId, isActive, name, trigger, action, config } = await req.json();
  if (!ruleId) {
    return NextResponse.json({ error: "ruleId is required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const rule = await prisma.webhookRule.findFirst({ where: { id: ruleId, orgId: req.orgId } });
  if (!rule) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const updated = await prisma.webhookRule.update({
    where: { id: ruleId },
    data: {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(name ? { name } : {}),
      ...(trigger ? { trigger } : {}),
      ...(action ? { action } : {}),
      ...(config ? { config } : {}),
    },
  });

  return NextResponse.json(updated);
}));

// DELETE /api/webhooks/rules — delete a webhook rule
export const DELETE = withErrorHandler(withRole("ADMIN", async (req) => {
  const url = new URL(req.url);
  const ruleId = url.searchParams.get("ruleId");
  if (!ruleId) {
    return NextResponse.json({ error: "ruleId is required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const rule = await prisma.webhookRule.findFirst({ where: { id: ruleId, orgId: req.orgId } });
  if (!rule) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  await prisma.webhookRule.delete({ where: { id: ruleId } });
  return NextResponse.json({ success: true });
}));
