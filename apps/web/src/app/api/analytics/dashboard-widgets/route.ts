import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/analytics/dashboard-widgets — real-time dashboard widget metrics
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const pageId = url.searchParams.get("pageId") || undefined;
  const pageFilter = pageId ? { pageId } : {};

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalPosts, scheduledCount, publishedToday, recentSnapshots] = await Promise.all([
    prisma.post.count({
      where: { orgId: req.orgId, ...pageFilter },
    }),
    prisma.post.count({
      where: { orgId: req.orgId, status: "SCHEDULED", ...pageFilter },
    }),
    prisma.post.count({
      where: {
        orgId: req.orgId,
        status: "PUBLISHED",
        publishedAt: { gte: todayStart },
        ...pageFilter,
      },
    }),
    prisma.analyticsSnapshot.findMany({
      where: {
        post: { orgId: req.orgId, status: "PUBLISHED", ...pageFilter },
        snapshotAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { snapshotAt: "desc" },
      distinct: ["postId"],
      select: {
        impressions: true,
        likes: true,
        comments: true,
        shares: true,
        saves: true,
      },
    }),
  ]);

  let engagementRate = 0;
  if (recentSnapshots.length > 0) {
    const totalImpressions = recentSnapshots.reduce((sum, s) => sum + s.impressions, 0);
    const totalEngagement = recentSnapshots.reduce(
      (sum, s) => sum + s.likes + s.comments + s.shares + s.saves,
      0
    );
    engagementRate = totalImpressions > 0
      ? (totalEngagement / totalImpressions) * 100
      : 0;
  }

  return NextResponse.json({
    totalPosts,
    scheduledCount,
    publishedToday,
    engagementRate: Math.round(engagementRate * 10) / 10,
  });
}));
