import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { OrgDetailTabs } from "../components/org-detail-tabs";
import { OrgActions } from "../components/org-actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const planColors: Record<string, { bg: string; text: string }> = {
  FREE: { bg: "var(--bg-hover)", text: "var(--text-secondary)" },
  PRO: { bg: "var(--accent-blue-muted)", text: "var(--accent-blue)" },
  AGENCY: { bg: "var(--accent-purple-muted)", text: "var(--accent-purple)" },
};

const statusColors: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "var(--accent-emerald-muted)", text: "var(--accent-emerald)" },
  TRIALING: { bg: "var(--accent-blue-muted)", text: "var(--accent-blue)" },
  PAST_DUE: { bg: "var(--accent-amber-muted)", text: "var(--accent-amber)" },
  CANCELED: { bg: "var(--accent-red-muted)", text: "var(--accent-red)" },
  UNPAID: { bg: "var(--accent-red-muted)", text: "var(--accent-red)" },
  INCOMPLETE: { bg: "var(--accent-amber-muted)", text: "var(--accent-amber)" },
  PAUSED: { bg: "var(--bg-hover)", text: "var(--text-secondary)" },
};

const roleColors: Record<string, string> = {
  OWNER: "var(--accent-purple)",
  ADMIN: "var(--accent-blue)",
  EDITOR: "var(--accent-emerald)",
  VIEWER: "var(--text-tertiary)",
};

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        background: bg,
        color,
      }}
    >
      {label}
    </span>
  );
}

function ProgressBar({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const barColor = pct >= 90 ? "var(--accent-red)" : pct >= 70 ? "var(--accent-amber)" : "var(--accent-blue)";

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
          {used} / {max}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: "var(--bg-primary)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: barColor,
            borderRadius: 4,
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  );
}

function formatDate(date: Date | string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function OrgDetailPage({ params }: PageProps) {
  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, lastLoginAt: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: {
        select: {
          memberships: true,
          platformConnections: true,
          posts: true,
        },
      },
    },
  });

  if (!org) notFound();

  const [paymentMethods, recentPosts, auditLogs] = await Promise.all([
    prisma.paymentMethod.findMany({
      where: { orgId: id },
      orderBy: { isDefault: "desc" },
    }),
    prisma.post.findMany({
      where: { orgId: id },
      select: {
        id: true,
        platform: true,
        content: true,
        status: true,
        scheduledAt: true,
        publishedAt: true,
        createdAt: true,
        pageName: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.auditLog.findMany({
      where: { orgId: id },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const pc = planColors[org.plan] || { bg: "var(--bg-hover)", text: "var(--text-secondary)" };
  const sc = statusColors[org.subscriptionStatus] || { bg: "var(--bg-hover)", text: "var(--text-secondary)" };

  // ── Overview Tab ────────────────────────────────────────────────────

  const overviewTab = (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-primary)",
          padding: 24,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--text-primary)" }}>
          Organization Details
        </h3>
        <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
          {[
            ["Name", org.name],
            ["Slug", org.slug],
            ["Industry", org.industry ?? "N/A"],
            ["Company Size", org.companySize ?? "N/A"],
            ["Website", org.website ?? "N/A"],
            ["Country", org.country ?? "N/A"],
            ["Timezone", org.defaultTimezone],
            ["Billing Email", org.billingEmail ?? "N/A"],
            ["Created", formatDate(org.createdAt)],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "grid", gridTemplateColumns: "minmax(100px, 140px) 1fr", gap: 8 }}>
              <span style={{ color: "var(--text-secondary)" }}>{label}</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(100px, 140px) 1fr", gap: 8 }}>
            <span style={{ color: "var(--text-secondary)" }}>Publishing</span>
            <span style={{ color: org.publishingPaused ? "var(--accent-red)" : "var(--accent-emerald)", fontWeight: 500 }}>
              {org.publishingPaused ? "Paused" : "Active"}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-primary)",
          padding: 24,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--text-primary)" }}>
          Usage Limits
        </h3>
        <ProgressBar label="Posts this month" used={org.postsUsedThisMonth} max={org.maxPostsPerMonth} />
        <ProgressBar label="Members" used={org._count.memberships} max={org.maxUsers} />
        <ProgressBar label="Connected platforms" used={org._count.platformConnections} max={org.maxPlatforms} />
      </div>

      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-primary)",
          padding: 24,
          gridColumn: "1 / -1",
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--text-primary)" }}>
          Subscription Details
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, fontSize: 14 }}>
          {[
            ["Plan", org.plan],
            ["Status", org.subscriptionStatus],
            ["Billing Cycle", org.billingCycle],
            ["Stripe Customer", org.stripeCustomerId ?? "None"],
            ["Stripe Subscription", org.stripeSubscriptionId ?? "None"],
            ["Cancel at Period End", org.cancelAtPeriodEnd ? "Yes" : "No"],
            ["Trial Ends", formatDate(org.trialEndsAt)],
            ["Current Period Start", formatDate(org.currentPeriodStart)],
            ["Current Period End", formatDate(org.currentPeriodEnd)],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ color: "var(--text-tertiary)", fontSize: 12, marginBottom: 2 }}>{label}</div>
              <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Members Tab ─────────────────────────────────────────────────────

  const membersTab = (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-primary)",
        minWidth: 500,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-primary)", textAlign: "left" }}>
            {["User", "Role", "Joined", "Last Login"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "12px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
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
          {org.memberships.map((m) => (
            <tr key={m.id} style={{ borderBottom: "1px solid var(--border-secondary)" }}>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {m.user.name ?? "Unnamed"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{m.user.email}</div>
              </td>
              <td style={{ padding: "12px 16px" }}>
                <span style={{ color: roleColors[m.role] ?? "var(--text-secondary)", fontWeight: 600 }}>
                  {m.role}
                </span>
              </td>
              <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                {formatDate(m.createdAt)}
              </td>
              <td style={{ padding: "12px 16px", color: "var(--text-tertiary)" }}>
                {m.user.lastLoginAt ? formatDate(m.user.lastLoginAt) : "Never"}
              </td>
            </tr>
          ))}
          {org.memberships.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
                No members
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );

  // ── Billing Tab ─────────────────────────────────────────────────────

  const defaultPm = paymentMethods.find((pm) => pm.isDefault) ?? paymentMethods[0];

  const billingTab = (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-primary)",
            padding: 20,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 4 }}>Current Plan</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{org.plan}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            {org.billingCycle} billing
          </div>
        </div>
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-primary)",
            padding: 20,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 4 }}>Next Billing Date</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
            {formatDate(org.currentPeriodEnd)}
          </div>
          {org.cancelAtPeriodEnd && (
            <div style={{ fontSize: 13, color: "var(--accent-red)", marginTop: 4 }}>
              Cancels at period end
            </div>
          )}
        </div>
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-primary)",
            padding: 20,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 4 }}>Stripe Customer</div>
          {org.stripeCustomerId ? (
            <a
              href={`https://dashboard.stripe.com/customers/${org.stripeCustomerId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 14, color: "var(--accent-blue)", textDecoration: "none", fontWeight: 600 }}
            >
              {org.stripeCustomerId}
            </a>
          ) : (
            <div style={{ fontSize: 14, color: "var(--text-tertiary)" }}>No Stripe customer</div>
          )}
        </div>
      </div>

      {/* Payment Method */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-primary)",
          padding: 24,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "var(--text-primary)" }}>
          Payment Method
        </h3>
        {defaultPm ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 32,
                background: "var(--bg-primary)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
              }}
            >
              {defaultPm.brand ?? "Card"}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                {(defaultPm.brand ?? "Card").charAt(0).toUpperCase() + (defaultPm.brand ?? "card").slice(1)} ending in {defaultPm.last4 ?? "****"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
                Expires {defaultPm.expMonth ?? "??"}/{defaultPm.expYear ?? "????"}
              </div>
            </div>
            {defaultPm.isDefault && (
              <Badge label="Default" bg="var(--accent-blue-muted)" color="var(--accent-blue)" />
            )}
          </div>
        ) : (
          <div style={{ color: "var(--text-tertiary)", fontSize: 14 }}>No payment method on file</div>
        )}
      </div>

      {/* Invoice History */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-primary)",
          minWidth: 560,
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            Invoice History
          </h3>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-primary)", textAlign: "left" }}>
              {["Invoice #", "Date", "Amount", "Status", "PDF"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-tertiary)",
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
            {org.invoices.map((inv) => {
              const invSc = statusColors[inv.status] ?? { bg: "var(--bg-hover)", text: "var(--text-secondary)" };
              return (
                <tr key={inv.id} style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                  <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: 500 }}>
                    {inv.number ?? inv.stripeInvoiceId.slice(0, 16)}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                    {formatDate(inv.createdAt)}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: 600 }}>
                    {formatCurrency(inv.amountDue, inv.currency)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge label={inv.status} bg={invSc.bg} color={invSc.text} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {inv.invoicePdf ? (
                      <a
                        href={inv.invoicePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--accent-blue)", textDecoration: "none", fontSize: 13 }}
                      >
                        Download
                      </a>
                    ) : (
                      <span style={{ color: "var(--text-tertiary)" }}>--</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {org.invoices.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
                  No invoices
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );

  // ── Posts Tab ───────────────────────────────────────────────────────

  const postStatusColors: Record<string, { bg: string; text: string }> = {
    PUBLISHED: { bg: "var(--accent-emerald-muted)", text: "var(--accent-emerald)" },
    SCHEDULED: { bg: "var(--accent-blue-muted)", text: "var(--accent-blue)" },
    DRAFT: { bg: "var(--bg-hover)", text: "var(--text-secondary)" },
    FAILED: { bg: "var(--accent-red-muted)", text: "var(--accent-red)" },
    PENDING_APPROVAL: { bg: "var(--accent-amber-muted)", text: "var(--accent-amber)" },
    PUBLISHING: { bg: "var(--accent-blue-muted)", text: "var(--accent-blue)" },
    APPROVED: { bg: "var(--accent-emerald-muted)", text: "var(--accent-emerald)" },
    REJECTED: { bg: "var(--accent-red-muted)", text: "var(--accent-red)" },
    DELETED: { bg: "var(--accent-red-muted)", text: "var(--accent-red)" },
  };

  const postsTab = (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-primary)",
        minWidth: 560,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-primary)", textAlign: "left" }}>
            {["Platform", "Content", "Page", "Status", "Created"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "12px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
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
          {recentPosts.map((post) => {
            const psc = postStatusColors[post.status] ?? { bg: "var(--bg-hover)", text: "var(--text-secondary)" };
            return (
              <tr key={post.id} style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: 500 }}>
                  {post.platform}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    color: "var(--text-secondary)",
                    maxWidth: 300,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {post.content.slice(0, 80)}{post.content.length > 80 ? "..." : ""}
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-tertiary)" }}>
                  {post.pageName ?? "--"}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Badge label={post.status} bg={psc.bg} color={psc.text} />
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-tertiary)", fontSize: 13 }}>
                  {formatDate(post.createdAt)}
                </td>
              </tr>
            );
          })}
          {recentPosts.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
                No posts
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );

  // ── Audit Log Tab ──────────────────────────────────────────────────

  const auditLogTab = (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
    <div
      style={{
        background: "var(--bg-secondary)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-primary)",
        minWidth: 500,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-primary)", textAlign: "left" }}>
            {["Action", "Entity", "User", "Date"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "12px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
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
          {auditLogs.map((log) => (
            <tr key={log.id} style={{ borderBottom: "1px solid var(--border-secondary)" }}>
              <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: 500 }}>
                {log.action}
              </td>
              <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                {log.entityType}
                <span style={{ color: "var(--text-tertiary)", fontSize: 12, marginLeft: 4 }}>
                  {log.entityId.slice(0, 8)}...
                </span>
              </td>
              <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                {log.user?.name ?? log.user?.email ?? "System"}
              </td>
              <td style={{ padding: "12px 16px", color: "var(--text-tertiary)", fontSize: 13 }}>
                {new Date(log.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
          {auditLogs.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 32, textAlign: "center", color: "var(--text-tertiary)" }}>
                No audit log entries
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );

  // ── Main Render ────────────────────────────────────────────────────

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/orgs"
        style={{
          display: "inline-block",
          marginBottom: 16,
          fontSize: 13,
          color: "var(--text-secondary)",
          textDecoration: "none",
        }}
      >
        &larr; Back to Organizations
      </Link>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {org.name}
            </h1>
            <Badge label={org.plan} bg={pc.bg} color={pc.text} />
            <Badge label={org.subscriptionStatus} bg={sc.bg} color={sc.text} />
          </div>
          <p style={{ fontSize: 14, color: "var(--text-tertiary)", margin: 0 }}>
            {org.slug} &middot; Created {formatDate(org.createdAt)}
          </p>
        </div>
        <OrgActions
          orgId={org.id}
          currentPlan={org.plan}
          hasSubscription={!!org.stripeSubscriptionId}
        />
      </div>

      {/* Tabs */}
      <OrgDetailTabs
        overview={overviewTab}
        members={membersTab}
        billing={billingTab}
        posts={postsTab}
        auditLog={auditLogTab}
      />
    </div>
  );
}
