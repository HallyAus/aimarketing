import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";

// GET /api/analytics/overview — org-wide aggregated metrics
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const days = parseInt(url.searchParams.get("days") ?? "30", 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get all posts for this org
  const posts = await prisma.post.findMany({
    where: {
      orgId: req.orgId,
      status: "PUBLISHED",
    },
    select: { id: true },
  });

  const postIds = posts.map((p) => p.id);

  if (postIds.length === 0) {
    return NextResponse.json({
      totalImpressions: 0,
      totalReach: 0,
      totalClicks: 0,
      totalEngagement: 0,
      totalSpend: 0,
      totalConversions: 0,
      postCount: 0,
      platformBreakdown: [],
    });
  }

  // Aggregate latest snapshot per post
  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: {
      postId: { in: postIds },
      snapshotAt: { gte: since },
    },
    orderBy: { snapshotAt: "desc" },
    distinct: ["postId"],
  });

  const totals = snapshots.reduce(
    (acc, s) => ({
      totalImpressions: acc.totalImpressions + s.impressions,
      totalReach: acc.totalReach + s.reach,
      totalClicks: acc.totalClicks + s.clicks,
      totalEngagement: acc.totalEngagement + s.likes + s.comments + s.shares + s.saves,
      totalSpend: acc.totalSpend + Number(s.spend),
      totalConversions: acc.totalConversions + s.conversions,
    }),
    { totalImpressions: 0, totalReach: 0, totalClicks: 0, totalEngagement: 0, totalSpend: 0, totalConversions: 0 }
  );

  // Platform breakdown
  const platformMap = new Map<string, typeof totals>();
  for (const s of snapshots) {
    const existing = platformMap.get(s.platform) ?? {
      totalImpressions: 0, totalReach: 0, totalClicks: 0,
      totalEngagement: 0, totalSpend: 0, totalConversions: 0,
    };
    platformMap.set(s.platform, {
      totalImpressions: existing.totalImpressions + s.impressions,
      totalReach: existing.totalReach + s.reach,
      totalClicks: existing.totalClicks + s.clicks,
      totalEngagement: existing.totalEngagement + s.likes + s.comments + s.shares + s.saves,
      totalSpend: existing.totalSpend + Number(s.spend),
      totalConversions: existing.totalConversions + s.conversions,
    });
  }

  const platformBreakdown = Array.from(platformMap.entries()).map(([platform, metrics]) => ({
    platform,
    ...metrics,
  }));

  return NextResponse.json({
    ...totals,
    postCount: postIds.length,
    platformBreakdown,
    period: { days, since: since.toISOString() },
  });
}));
