import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/reports/generate — list generated reports
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const pageId = url.searchParams.get("pageId") || undefined;

  const reports = await prisma.performanceReport.findMany({
    where: { orgId: req.orgId, ...(pageId ? { pageId } : {}) },
    include: { page: { select: { id: true, name: true, platform: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: reports });
}));

// POST /api/reports/generate — generate a new report
export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const { pageId, reportType, startDate, endDate, clientName, logoUrl, brandColor, sendTo } = await req.json();

  if (!reportType || !startDate || !endDate) {
    return NextResponse.json({ error: "reportType, startDate, and endDate are required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Aggregate analytics data
  const whereClause: Record<string, unknown> = {
    post: { orgId: req.orgId },
    snapshotAt: { gte: start, lte: end },
  };
  if (pageId) {
    (whereClause.post as Record<string, unknown>).pageId = pageId;
  }

  const snapshots = await prisma.analyticsSnapshot.findMany({
    where: whereClause,
    include: { post: { select: { platform: true, content: true, pageName: true } } },
  });

  // Aggregate metrics
  const totals = {
    impressions: 0, reach: 0, clicks: 0, likes: 0,
    comments: 0, shares: 0, saves: 0, videoViews: 0,
    conversions: 0, postCount: 0,
  };
  const platformBreakdown: Record<string, typeof totals> = {};

  for (const snap of snapshots) {
    totals.impressions += snap.impressions;
    totals.reach += snap.reach;
    totals.clicks += snap.clicks;
    totals.likes += snap.likes;
    totals.comments += snap.comments;
    totals.shares += snap.shares;
    totals.saves += snap.saves;
    totals.videoViews += snap.videoViews;
    totals.conversions += snap.conversions;
    totals.postCount++;

    const platform = snap.post.platform;
    if (!platformBreakdown[platform]) {
      platformBreakdown[platform] = { ...totals, impressions: 0, reach: 0, clicks: 0, likes: 0, comments: 0, shares: 0, saves: 0, videoViews: 0, conversions: 0, postCount: 0 };
    }
    platformBreakdown[platform].impressions += snap.impressions;
    platformBreakdown[platform].reach += snap.reach;
    platformBreakdown[platform].clicks += snap.clicks;
    platformBreakdown[platform].likes += snap.likes;
    platformBreakdown[platform].comments += snap.comments;
    platformBreakdown[platform].shares += snap.shares;
    platformBreakdown[platform].postCount++;
  }

  const postCount = await prisma.post.count({
    where: {
      orgId: req.orgId,
      ...(pageId ? { pageId } : {}),
      publishedAt: { gte: start, lte: end },
    },
  });

  const reportData = {
    clientName: clientName ?? "Client",
    logoUrl: logoUrl ?? null,
    brandColor: brandColor ?? "#3b82f6",
    period: { start: start.toISOString(), end: end.toISOString() },
    totals,
    platformBreakdown,
    postsPublished: postCount,
    generatedAt: new Date().toISOString(),
  };

  const report = await prisma.performanceReport.create({
    data: {
      orgId: req.orgId,
      pageId: pageId ?? null,
      reportType,
      startDate: start,
      endDate: end,
      data: reportData as never,
      sentTo: sendTo ?? [],
    },
  });

  return NextResponse.json({ report, reportData }, { status: 201 });
}));
