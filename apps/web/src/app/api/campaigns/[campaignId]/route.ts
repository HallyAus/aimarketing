import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";
import { updateCampaignSchema } from "@adpilot/shared";

// GET /api/campaigns/[campaignId]
export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const campaignId = (await context.params).campaignId!;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: req.orgId },
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          platform: true,
          content: true,
          status: true,
          scheduledAt: true,
          publishedAt: true,
          createdAt: true,
        },
      },
      creator: { select: { name: true, email: true } },
      _count: { select: { posts: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  return NextResponse.json(campaign);
}));

// PATCH /api/campaigns/[campaignId] — optimistic concurrency
export const PATCH = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const campaignId = (await context.params).campaignId!;
  const body = await req.json();
  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { version, ...updateData } = parsed.data;

  // Optimistic concurrency check
  const existing = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: req.orgId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  if (existing.version !== version) {
    return NextResponse.json(
      { error: "Conflict — campaign was modified", code: "CONFLICT", statusCode: 409, currentVersion: existing.version },
      { status: 409 }
    );
  }

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      ...updateData,
      startDate: updateData.startDate ? new Date(updateData.startDate) : updateData.startDate === null ? null : undefined,
      endDate: updateData.endDate ? new Date(updateData.endDate) : updateData.endDate === null ? null : undefined,
      version: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "UPDATE",
      entityType: "Campaign",
      entityId: campaignId,
      before: { name: existing.name, version: existing.version },
      after: { ...updateData, version: campaign.version },
    },
  });

  return NextResponse.json(campaign);
}));

// DELETE /api/campaigns/[campaignId]
export const DELETE = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const campaignId = (await context.params).campaignId!;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: req.orgId },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  await prisma.campaign.delete({ where: { id: campaignId } });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "DELETE",
      entityType: "Campaign",
      entityId: campaignId,
      before: { name: campaign.name },
    },
  });

  return NextResponse.json({ success: true });
}));
