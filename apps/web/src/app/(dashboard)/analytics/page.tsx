import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { EmptyState } from "@/components/empty-state";
import { PlatformBadge } from "@/components/platform-badge";
import { ActiveAccountBanner } from "@/components/active-account-banner";
import { getActiveAccount } from "@/lib/active-account";
import { getActivePageId, pageWhere } from "@/lib/active-page";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false },
};

export default async function AnalyticsPage() {

  if (false) {
    redirect("/org-picker");
  }

  const orgId = await getSessionOrg();
  const activeAccount = await getActiveAccount();
  const activePageId = await getActivePageId(orgId);
  const pf = pageWhere(activePageId);

  // Get published posts with latest metrics — select only needed fields
  const posts = await prisma.post.findMany({
    where: { orgId, status: "PUBLISHED", ...pf },
    select: {
      id: true,
      platform: true,
      content: true,
      publishedAt: true,
      pageName: true,
      campaign: { select: { name: true } },
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
          spend: true,
          conversions: true,
          ctr: true,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  // Aggregate totals
  type Totals = { impressions: number; reach: number; clicks: number; engagement: number; spend: number; conversions: number };
  const totals = posts.reduce(
    (acc: Totals, post: (typeof posts)[number]) => {
      const m = post.analytics[0];
      if (!m) return acc;
      return {
        impressions: acc.impressions + m.impressions,
        reach: acc.reach + m.reach,
        clicks: acc.clicks + m.clicks,
        engagement: acc.engagement + m.likes + m.comments + m.shares + m.saves,
        spend: acc.spend + Number(m.spend),
        conversions: acc.conversions + m.conversions,
      };
    },
    { impressions: 0, reach: 0, clicks: 0, engagement: 0, spend: 0, conversions: 0 }
  );

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle={activeAccount ? `See how your posts perform \— impressions, clicks, engagement across all platforms \— ${activeAccount.name}` : "See how your posts perform \— impressions, clicks, engagement across all platforms"}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Analytics" },
        ]}
        action={
          <a href="/api/analytics/export?days=30" className="btn-secondary">
            Export CSV
          </a>
        }
      />
      <ActiveAccountBanner account={activeAccount} />

      {/* Overview metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <MetricCard label="Impressions" value={totals.impressions.toLocaleString()} accent="var(--accent-blue)" />
        <MetricCard label="Reach" value={totals.reach.toLocaleString()} accent="var(--accent-purple)" />
        <MetricCard label="Clicks" value={totals.clicks.toLocaleString()} accent="var(--accent-emerald)" />
        <MetricCard label="Engagement" value={totals.engagement.toLocaleString()} accent="var(--accent-amber)" />
        <MetricCard label="Spend" value={`$${totals.spend.toFixed(2)}`} accent="var(--accent-red)" />
        <MetricCard label="Conversions" value={totals.conversions.toLocaleString()} accent="var(--accent-blue)" />
      </div>

      {/* Post Performance Table */}
      <div className="section-label mb-3">Post Performance</div>
      {posts.length === 0 ? (
        <EmptyState
          title="No published posts yet"
          description="Publish posts to see performance data here."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-secondary)" }}>
                  <span className="section-label">Campaign</span>
                </th>
                <th className="px-3 py-2 text-left" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-secondary)" }}>
                  <span className="section-label">Platform</span>
                </th>
                <th className="px-3 py-2 text-left" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-secondary)" }}>
                  <span className="section-label">Content</span>
                </th>
                <th className="px-3 py-2 text-right" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-secondary)" }}>
                  <span className="section-label">Impressions</span>
                </th>
                <th className="px-3 py-2 text-right" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-secondary)" }}>
                  <span className="section-label">Clicks</span>
                </th>
                <th className="px-3 py-2 text-right" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-secondary)" }}>
                  <span className="section-label">Engagement</span>
                </th>
                <th className="px-3 py-2 text-right" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-secondary)" }}>
                  <span className="section-label">CTR</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const m = post.analytics[0];
                return (
                  <tr key={post.id} className="table-row">
                    <td className="px-3 py-2.5" style={{ color: "var(--text-primary)" }}>{post.campaign?.name ?? "No campaign"}</td>
                    <td className="px-3 py-2.5">
                      <PlatformBadge platform={post.platform} />
                    </td>
                    <td className="px-3 py-2.5 max-w-xs truncate" style={{ color: "var(--text-secondary)" }}>{post.content}</td>
                    <td className="px-3 py-2.5 text-right font-medium" style={{ color: "var(--text-primary)" }}>{m?.impressions?.toLocaleString() ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right font-medium" style={{ color: "var(--text-primary)" }}>{m?.clicks?.toLocaleString() ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right font-medium" style={{ color: "var(--text-primary)" }}>
                      {m ? (m.likes + m.comments + m.shares + m.saves).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {m?.ctr ? (
                        <span className="badge badge-success">{(m.ctr * 100).toFixed(2)}%</span>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
