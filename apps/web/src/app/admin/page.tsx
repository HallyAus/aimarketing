import { prisma } from "@/lib/db";
import { relativeTime } from "./components/relative-time";
import Link from "next/link";

export default async function AdminDashboard() {
  // ── Row 1: Metric queries (parallel) ────────────────────────────────
  const [
    totalUsers,
    totalOrgs,
    proMonthly,
    proAnnual,
    agencyMonthly,
    agencyAnnual,
    freeActive,
    proActive,
    agencyActive,
    recentLogs,
    scheduledNext24h,
    failedLast7d,
    totalConnections,
  ] = await Promise.all([
    // Total users
    prisma.user.count({ where: { deletedAt: null } }),

    // Total orgs
    prisma.organization.count({ where: { deletedAt: null } }),

    // MRR: Pro monthly
    prisma.organization.count({
      where: {
        plan: "PRO",
        subscriptionStatus: "ACTIVE",
        billingCycle: "MONTHLY",
        deletedAt: null,
      },
    }),
    // MRR: Pro annual
    prisma.organization.count({
      where: {
        plan: "PRO",
        subscriptionStatus: "ACTIVE",
        billingCycle: "ANNUAL",
        deletedAt: null,
      },
    }),
    // MRR: Agency monthly
    prisma.organization.count({
      where: {
        plan: "AGENCY",
        subscriptionStatus: "ACTIVE",
        billingCycle: "MONTHLY",
        deletedAt: null,
      },
    }),
    // MRR: Agency annual
    prisma.organization.count({
      where: {
        plan: "AGENCY",
        subscriptionStatus: "ACTIVE",
        billingCycle: "ANNUAL",
        deletedAt: null,
      },
    }),

    // Active subs by plan
    prisma.organization.count({
      where: { plan: "FREE", subscriptionStatus: "ACTIVE", deletedAt: null },
    }),
    prisma.organization.count({
      where: { plan: "PRO", subscriptionStatus: "ACTIVE", deletedAt: null },
    }),
    prisma.organization.count({
      where: { plan: "AGENCY", subscriptionStatus: "ACTIVE", deletedAt: null },
    }),

    // Recent audit logs
    prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),

    // Posts scheduled next 24h
    prisma.post.count({
      where: {
        status: "SCHEDULED",
        scheduledAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Failed posts last 7d
    prisma.post.count({
      where: {
        status: "FAILED",
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),

    // Total connected accounts
    prisma.platformConnection.count({
      where: { status: "ACTIVE" },
    }),
  ]);

  // MRR: annual divided by 12 for monthly equivalent
  const mrr =
    proMonthly * 49 +
    Math.round((proAnnual * 49 * 10) / 12) + // annual Pro = 10mo price / 12
    agencyMonthly * 299 +
    Math.round((agencyAnnual * 299 * 10) / 12);

  const totalActiveSubs = freeActive + proActive + agencyActive;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        Admin Dashboard
      </h1>

      {/* ── Row 1: Metric Cards ──────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <MetricCard label="Total Users" value={totalUsers.toLocaleString()} />
        <MetricCard label="Total Organizations" value={totalOrgs.toLocaleString()} />
        <MetricCard label="MRR" value={`$${mrr.toLocaleString()}`} />
        <MetricCard
          label="Active Subscriptions"
          value={totalActiveSubs.toLocaleString()}
          detail={`Free: ${freeActive} / Pro: ${proActive} / Agency: ${agencyActive}`}
        />
      </div>

      {/* ── Row 2: Recent Activity ───────────────────────── */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: 8,
          border: "1px solid var(--border-primary, #2a2a2a)",
          padding: 20,
          marginBottom: 32,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>
          Recent Activity
        </h2>
        {recentLogs.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No activity yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Time", "User", "Action", "Entity", "Entity ID"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      borderBottom: "1px solid var(--border-primary, #2a2a2a)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log) => (
                <tr key={log.id}>
                  <td style={cellStyle}>{relativeTime(log.createdAt)}</td>
                  <td style={cellStyle}>{log.user?.name ?? log.user?.email ?? "System"}</td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "var(--bg-primary)",
                        color: "var(--text-primary)",
                        fontFamily: "monospace",
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={cellStyle}>{log.entityType}</td>
                  <td style={cellStyle}>
                    {log.entityType === "User" ? (
                      <Link
                        href={`/admin/users/${log.entityId}`}
                        style={{ color: "var(--accent-blue)", textDecoration: "none", fontSize: 13 }}
                      >
                        {log.entityId.slice(0, 12)}...
                      </Link>
                    ) : (
                      <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--text-secondary)" }}>
                        {log.entityId.slice(0, 12)}...
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Row 3: Quick Stats ───────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard label="Scheduled (next 24h)" value={scheduledNext24h.toLocaleString()} />
        <MetricCard
          label="Failed Posts (7d)"
          value={failedLast7d.toLocaleString()}
          variant={failedLast7d > 0 ? "warning" : "default"}
        />
        <MetricCard label="Connected Accounts" value={totalConnections.toLocaleString()} />
      </div>
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────

const cellStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 13,
  color: "var(--text-primary)",
  borderBottom: "1px solid var(--border-primary, #2a2a2a)",
};

function MetricCard({
  label,
  value,
  detail,
  variant = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  variant?: "default" | "warning";
}) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRadius: 8,
        border: `1px solid ${variant === "warning" ? "#e5484d33" : "var(--border-primary, #2a2a2a)"}`,
        padding: 20,
      }}
    >
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: variant === "warning" ? "#e5484d" : "var(--text-primary)",
        }}
      >
        {value}
      </div>
      {detail && (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>
          {detail}
        </div>
      )}
    </div>
  );
}
