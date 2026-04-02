import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { createCampaignSchema, checkPlanLimit, sanitizeHtml } from "@adpilot/shared";

// GET /api/campaigns — list campaigns for current org
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where: { orgId: req.orgId },
      include: {
        _count: { select: { posts: true } },
        creator: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.campaign.count({ where: { orgId: req.orgId } }),
  ]);

  return NextResponse.json({
    data: campaigns,
    pagination: { page, limit, total, hasMore: skip + campaigns.length < total },
  });
}));

// POST /api/campaigns — create a new campaign
export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const body = await req.json();
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Check post limit (creating a campaign doesn't count, but check org plan is valid)
  const org = await prisma.organization.findUnique({ where: { id: req.orgId } });
  if (!org) {
    return NextResponse.json({ error: "Org not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      orgId: req.orgId,
      name: sanitizeHtml(parsed.data.name),
      objective: parsed.data.objective,
      budget: parsed.data.budget,
      currency: parsed.data.currency,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      targetPlatforms: parsed.data.targetPlatforms,
      audienceConfig: parsed.data.audienceConfig as Record<string, unknown> as never ?? undefined,
      createdBy: req.userId,
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "CREATE",
      entityType: "Campaign",
      entityId: campaign.id,
      after: { name: campaign.name, objective: campaign.objective },
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}));
