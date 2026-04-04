import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

/** Escape a string value for safe CSV inclusion, preventing CSV injection */
function csvSafe(value: unknown): string {
  const str = String(value ?? "");
  // Prefix formula-triggering characters with a tab to prevent CSV injection
  const sanitized = /^[=+\-@]/.test(str) ? "\t" + str : str;
  // Always wrap in quotes and escape internal quotes
  return `"${sanitized.replace(/"/g, '""')}"`;
}

// GET /api/analytics/export — CSV export of analytics data
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const campaignId = url.searchParams.get("campaignId");
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") ?? "30", 10), 1), 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get posts (optionally filtered by campaign)
  const pageId = url.searchParams.get("pageId");
  const where: Record<string, unknown> = {
    orgId: req.orgId,
    status: "PUBLISHED",
  };
  if (campaignId) where.campaignId = campaignId;
  if (pageId) where.pageId = pageId;

  const posts = await prisma.post.findMany({
    where,
    include: {
      campaign: { select: { name: true } },
      analytics: {
        where: { snapshotAt: { gte: since } },
        orderBy: { snapshotAt: "desc" },
        take: 1,
      },
    },
  });

  // Build CSV
  const headers = [
    "Campaign", "Platform", "Content", "Published At",
    "Impressions", "Reach", "Clicks", "Likes", "Comments",
    "Shares", "Saves", "Video Views", "Spend", "Conversions",
    "CTR", "CPC", "CPM",
  ];

  const rows = posts.map((post) => {
    const metrics = post.analytics[0];
    return [
      csvSafe(post.campaign?.name ?? "No campaign"),
      csvSafe(post.platform),
      csvSafe(post.content.substring(0, 200)),
      csvSafe(post.publishedAt?.toISOString() ?? ""),
      metrics?.impressions ?? 0,
      metrics?.reach ?? 0,
      metrics?.clicks ?? 0,
      metrics?.likes ?? 0,
      metrics?.comments ?? 0,
      metrics?.shares ?? 0,
      metrics?.saves ?? 0,
      metrics?.videoViews ?? 0,
      metrics?.spend ?? 0,
      metrics?.conversions ?? 0,
      metrics?.ctr?.toFixed(4) ?? 0,
      metrics?.cpc ?? 0,
      metrics?.cpm ?? 0,
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="reachpilot-analytics-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}));
