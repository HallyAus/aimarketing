import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/analytics/dashboard-widgets — real-time dashboard widget metrics
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const pageId = url.searchParams.get("pageId") || undefined;
  const pageFilter = pageId ? { pageId } : {};
  const clientTz = url.searchParams.get("tz") || "UTC";

  // Compute "today" start in the user's timezone
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: clientTz });
  const midnightUTC = new Date(todayStr + "T00:00:00Z");
  const sample = new Date();
  const utcMs = new Date(sample.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  const tzMs = new Date(sample.toLocaleString("en-US", { timeZone: clientTz })).getTime();
  const todayStart = new Date(midnightUTC.getTime() - (tzMs - utcMs));

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

  // Side-effect: check for due scheduled posts and trigger publishing
  // This runs every 30s via dashboard polling — acts as a lightweight scheduler
  const dueCount = await prisma.post.count({
    where: { status: "SCHEDULED", scheduledAt: { lte: new Date() }, orgId: req.orgId },
  });
  if (dueCount > 0) {
    // Fire-and-forget: call the cron endpoint internally
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
    if (baseUrl && process.env.CRON_SECRET) {
      fetch(`${baseUrl}/api/cron/publish-scheduled`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      }).catch(() => {}); // fire and forget
    }
  }

  return NextResponse.json(
    {
      totalPosts,
      scheduledCount,
      publishedToday,
      engagementRate: Math.round(engagementRate * 10) / 10,
      dueForPublishing: dueCount,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    },
  );
}));
