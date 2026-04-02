import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { createPostSchema, checkPlanLimit, sanitizeHtml } from "@adpilot/shared";

// GET /api/campaigns/[campaignId]/posts
export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const campaignId = (await context.params).campaignId!;
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where = { campaignId, orgId: req.orgId };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    data: posts,
    pagination: { page, limit, total, hasMore: skip + posts.length < total },
  });
}));

// POST /api/campaigns/[campaignId]/posts — create post
export const POST = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const campaignId = (await context.params).campaignId!;
  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Verify campaign belongs to org
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: req.orgId },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  // Check platform is connected
  const connection = await prisma.platformConnection.findFirst({
    where: { orgId: req.orgId, platform: parsed.data.platform, status: "ACTIVE" },
  });
  if (!connection) {
    return NextResponse.json(
      { error: `No active ${parsed.data.platform} connection`, code: "NO_CONNECTION", statusCode: 400 },
      { status: 400 }
    );
  }

  // Check monthly post limit
  const org = await prisma.organization.findUnique({ where: { id: req.orgId } });
  if (org) {
    const startOfMonth = org.billingCycleAnchor
      ? new Date(new Date().getFullYear(), new Date().getMonth(), org.billingCycleAnchor.getDate())
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const postCount = await prisma.post.count({
      where: {
        orgId: req.orgId,
        createdAt: { gte: startOfMonth },
        status: { notIn: ["DELETED"] },
      },
    });

    const limitCheck = checkPlanLimit(org.plan, "postsThisMonth", {
      platformConnections: 0,
      postsThisMonth: postCount,
      teamMembers: 0,
    });

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.reason, code: "PLAN_LIMIT", statusCode: 403, upgradeRequired: limitCheck.upgradeRequired },
        { status: 403 }
      );
    }
  }

  const post = await prisma.post.create({
    data: {
      campaignId,
      orgId: req.orgId,
      platform: parsed.data.platform,
      content: sanitizeHtml(parsed.data.content),
      mediaUrls: parsed.data.mediaUrls,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
    },
  });

  return NextResponse.json(post, { status: 201 });
}));
