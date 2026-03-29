import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.currentOrgId) {
    redirect("/org-picker");
  }

  const orgId = session.user.currentOrgId;

  // Get published posts with latest metrics
  const posts = await prisma.post.findMany({
    where: { orgId, status: "PUBLISHED" },
    include: {
      campaign: { select: { name: true } },
      analytics: {
        orderBy: { snapshotAt: "desc" },
        take: 1,
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  // Aggregate totals
  const totals = posts.reduce(
    (acc, post) => {
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <a
          href={`/api/analytics/export?days=30`}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Export CSV
        </a>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Impressions</div>
          <div className="text-2xl font-bold">{totals.impressions.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Reach</div>
          <div className="text-2xl font-bold">{totals.reach.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Clicks</div>
          <div className="text-2xl font-bold">{totals.clicks.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Engagement</div>
          <div className="text-2xl font-bold">{totals.engagement.toLocaleString()}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Spend</div>
          <div className="text-2xl font-bold">${totals.spend.toFixed(2)}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Conversions</div>
          <div className="text-2xl font-bold">{totals.conversions.toLocaleString()}</div>
        </div>
      </div>

      {/* Post Performance Table */}
      <h2 className="text-lg font-semibold mb-4">Post Performance</h2>
      {posts.length === 0 ? (
        <p className="text-gray-500">No published posts yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Campaign</th>
                <th className="p-2">Platform</th>
                <th className="p-2">Content</th>
                <th className="p-2 text-right">Impressions</th>
                <th className="p-2 text-right">Clicks</th>
                <th className="p-2 text-right">Engagement</th>
                <th className="p-2 text-right">CTR</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const m = post.analytics[0];
                return (
                  <tr key={post.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{post.campaign.name}</td>
                    <td className="p-2">{post.platform}</td>
                    <td className="p-2 max-w-xs truncate">{post.content}</td>
                    <td className="p-2 text-right">{m?.impressions?.toLocaleString() ?? "—"}</td>
                    <td className="p-2 text-right">{m?.clicks?.toLocaleString() ?? "—"}</td>
                    <td className="p-2 text-right">
                      {m ? (m.likes + m.comments + m.shares + m.saves).toLocaleString() : "—"}
                    </td>
                    <td className="p-2 text-right">
                      {m?.ctr ? `${(m.ctr * 100).toFixed(2)}%` : "—"}
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
