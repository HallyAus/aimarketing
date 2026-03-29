import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";

// GET /api/analytics/campaigns/[campaignId] — per-campaign metrics
export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const campaignId = (await context.params).campaignId!;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: req.orgId },
    select: { id: true, name: true, status: true },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const posts = await prisma.post.findMany({
    where: { campaignId, orgId: req.orgId },
    select: {
      id: true,
      platform: true,
      content: true,
      status: true,
      publishedAt: true,
      engagementSnapshot: true,
      analytics: {
        orderBy: { snapshotAt: "desc" },
        take: 1,
        select: {
          impressions: true,
          reach: true,
          clicks: true,
          likes: true,
          comments: true,
          shares: true,
          saves: true,
          videoViews: true,
          spend: true,
          conversions: true,
          ctr: true,
          cpc: true,
          cpm: true,
          snapshotAt: true,
        },
      },
    },
  });

  // Time series for the campaign (all snapshots, ordered)
  const postIds = posts.map((p) => p.id);
  const timeSeries = await prisma.analyticsSnapshot.findMany({
    where: { postId: { in: postIds } },
    orderBy: { snapshotAt: "asc" },
    select: {
      postId: true,
      platform: true,
      snapshotAt: true,
      impressions: true,
      reach: true,
      clicks: true,
      likes: true,
      comments: true,
      shares: true,
    },
  });

  return NextResponse.json({
    campaign,
    posts: posts.map((p) => ({
      ...p,
      latestMetrics: p.analytics[0] ?? null,
    })),
    timeSeries,
  });
}));
