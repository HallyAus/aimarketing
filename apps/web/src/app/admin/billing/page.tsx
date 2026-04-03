import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatCurrency(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatDate(date: Date | string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PAID: { bg: "var(--accent-emerald-muted)", text: "var(--accent-emerald)" },
  OPEN: { bg: "var(--accent-amber-muted)", text: "var(--accent-amber)" },
  DRAFT: { bg: "var(--bg-hover)", text: "var(--text-secondary)" },
  VOID: { bg: "var(--accent-red-muted)", text: "var(--accent-red)" },
  UNCOLLECTIBLE: { bg: "var(--accent-red-muted)", text: "var(--accent-red)" },
};

export default async function BillingDashboardPage() {
  // Aggregate MRR from active paid subscriptions
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activePaidOrgs,
    pastDueOrgs,
    canceledThisMonth,
    recentInvoices,
    paidInvoicesThisMonth,
  ] = await Promise.all([
    prisma.organization.count({
      where: {
        plan: { not: "FREE" },
        subscriptionStatus: "ACTIVE",
        deletedAt: null,
      },
    }),
    prisma.organization.count({
      where: {
        subscriptionStatus: "PAST_DUE",
        deletedAt: null,
      },
    }),
    prisma.organization.count({
      where: {
        subscriptionStatus: "CANCELED",
        updatedAt: { gte: startOfMonth },
        deletedAt: null,
      },
    }),
    prisma.invoice.findMany({
      include: {
        organization: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.invoice.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: startOfMonth },
      },
      select: { amountPaid: true },
    }),
  ]);

  // Calculate MRR from paid invoices this month
  const mrr = paidInvoicesThisMonth.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const arr = mrr * 12;

  const cards = [
    { label: "MRR", value: formatCurrency(mrr), color: "var(--accent-blue)" },
    { label: "ARR", value: formatCurrency(arr), color: "var(--accent-purple)" },
    { label: "Active Paid", value: activePaidOrgs.toString(), color: "var(--accent-emerald)" },
    { label: "Past Due", value: pastDueOrgs.toString(), color: "var(--accent-amber)" },
    { label: "Canceled This Month", value: canceledThisMonth.toString(), color: "var(--accent-red)" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        Billing Dashboard
      </h1>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 32 }}>
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-primary)",
              padding: 20,
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Invoices */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-primary)",
          overflow: "auto",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            Recent Invoices
          </h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-primary)", textAlign: "left" }}>
              {["Organization", "Invoice #", "Amount", "Status", "Date"].map((h) => (
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
            {recentInvoices.map((inv) => {
              const sc = statusColors[inv.status] ?? { bg: "var(--bg-hover)", text: "var(--text-secondary)" };
              return (
                <tr key={inv.id} style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {inv.organization.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                      {inv.organization.slug}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                    {inv.number ?? inv.stripeInvoiceId.slice(0, 16)}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: 600 }}>
                    {formatCurrency(inv.amountDue, inv.currency)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: sc.bg,
                        color: sc.text,
                      }}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-tertiary)", fontSize: 13 }}>
                    {formatDate(inv.createdAt)}
                  </td>
                </tr>
              );
            })}
            {recentInvoices.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}
                >
                  No invoices yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
