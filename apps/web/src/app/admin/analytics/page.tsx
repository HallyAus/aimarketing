import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics | Admin" };

const cardStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-primary, #2a2a2a)",
  borderRadius: 8,
  padding: "20px 24px",
};

const statLabel: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  fontWeight: 600,
  marginBottom: 4,
};

const statValue: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: "var(--text-primary)",
};

const platformColor: Record<string, string> = {
  FACEBOOK: "#1877f2",
  INSTAGRAM: "#e4405f",
  TIKTOK: "#010101",
  LINKEDIN: "#0a66c2",
  TWITTER_X: "#1da1f2",
  GOOGLE_ADS: "#4285f4",
  YOUTUBE: "#ff0000",
  PINTEREST: "#e60023",
  SNAPCHAT: "#fffc00",
};

export default async function AnalyticsPage() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    postsByPlatform,
    postsToday,
    postsThisWeek,
    postsThisMonth,
    topPosts,
    dauCount,
    totalPosts,
    totalUsers,
    totalOrgs,
  ] = await Promise.all([
    prisma.post.groupBy({
      by: ["platform"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.post.count({
      where: { publishedAt: { gte: todayStart } },
    }),
    prisma.post.count({
      where: { publishedAt: { gte: weekStart } },
    }),
    prisma.post.count({
      where: { publishedAt: { gte: monthStart } },
    }),
    prisma.post.findMany({
      where: {
        analytics: { some: {} },
      },
      include: {
        organization: { select: { name: true } },
        analytics: {
          orderBy: { snapshotAt: "desc" },
          take: 1,
          select: { impressions: true, clicks: true, likes: true, shares: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.user.count({
      where: { lastLoginAt: { gte: todayStart } },
    }),
    prisma.post.count(),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.organization.count({ where: { deletedAt: null } }),
  ]);

  // Sort top posts by engagement (impressions) and take top 10
  const sortedTopPosts = topPosts
    .filter((p) => p.analytics.length > 0)
    .sort((a, b) => (b.analytics[0]?.impressions || 0) - (a.analytics[0]?.impressions || 0))
    .slice(0, 10);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        Analytics Dashboard
      </h1>

      {/* Overview cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div style={cardStyle}>
          <div style={statLabel}>Total Posts</div>
          <div style={statValue}>{totalPosts.toLocaleString()}</div>
        </div>
        <div style={cardStyle}>
          <div style={statLabel}>Published Today</div>
          <div style={statValue}>{postsToday.toLocaleString()}</div>
        </div>
        <div style={cardStyle}>
          <div style={statLabel}>Published This Week</div>
          <div style={statValue}>{postsThisWeek.toLocaleString()}</div>
        </div>
        <div style={cardStyle}>
          <div style={statLabel}>Published This Month</div>
          <div style={statValue}>{postsThisMonth.toLocaleString()}</div>
        </div>
        <div style={cardStyle}>
          <div style={statLabel}>Daily Active Users</div>
          <div style={statValue}>{dauCount.toLocaleString()}</div>
        </div>
        <div style={cardStyle}>
          <div style={statLabel}>Total Users</div>
          <div style={statValue}>{totalUsers.toLocaleString()}</div>
        </div>
        <div style={cardStyle}>
          <div style={statLabel}>Organizations</div>
          <div style={statValue}>{totalOrgs.toLocaleString()}</div>
        </div>
      </div>

      {/* Posts by platform */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
        Posts by Platform
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
        {postsByPlatform.map((g) => (
          <div key={g.platform} style={{
            ...cardStyle,
            borderLeft: `4px solid ${platformColor[g.platform] || "#6b7280"}`,
          }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginBottom: 4 }}>
              {g.platform.replace("_", " ")}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
              {g._count.id.toLocaleString()}
            </div>
          </div>
        ))}
        {postsByPlatform.length === 0 && (
          <div style={{ padding: 20, color: "var(--text-secondary)" }}>No post data yet</div>
        )}
      </div>

      {/* Top posts by engagement */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
        Top 10 Posts by Engagement
      </h2>
      <div style={{ overflowX: "auto", marginBottom: 32 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
              {["Content", "Organization", "Platform", "Impressions", "Clicks", "Likes", "Shares"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedTopPosts.map((post) => {
              const snap = post.analytics[0];
              return (
                <tr key={post.id} style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                  <td style={{ padding: "12px", color: "var(--text-primary)", maxWidth: 250 }}>
                    {post.content.length > 80 ? post.content.slice(0, 80) + "..." : post.content}
                  </td>
                  <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{post.organization.name}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: platformColor[post.platform] || "#6b7280",
                      color: post.platform === "SNAPCHAT" ? "#000" : "#fff",
                    }}>
                      {post.platform.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ padding: "12px", color: "var(--text-primary)", fontWeight: 600 }}>{snap?.impressions?.toLocaleString() || 0}</td>
                  <td style={{ padding: "12px", color: "var(--text-primary)" }}>{snap?.clicks?.toLocaleString() || 0}</td>
                  <td style={{ padding: "12px", color: "var(--text-primary)" }}>{snap?.likes?.toLocaleString() || 0}</td>
                  <td style={{ padding: "12px", color: "var(--text-primary)" }}>{snap?.shares?.toLocaleString() || 0}</td>
                </tr>
              );
            })}
            {sortedTopPosts.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                  No engagement data yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
