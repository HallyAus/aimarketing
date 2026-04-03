import { prisma } from "@/lib/db";
import { relativeTime } from "../components/relative-time";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Waitlist | Admin" };

const tierColor: Record<string, string> = {
  FREE: "#6b7280",
  PRO: "#3b82f6",
  AGENCY: "#8b5cf6",
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-primary, #2a2a2a)",
  borderRadius: 8,
  padding: "20px 24px",
};

interface Props {
  searchParams: Promise<{
    converted?: string;
    plan?: string;
    page?: string;
  }>;
}

export default async function WaitlistPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 25;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (params.converted === "yes") {
    where.convertedAt = { not: null };
  } else if (params.converted === "no") {
    where.convertedAt = null;
  }
  if (params.plan && params.plan !== "ALL") {
    where.planInterest = params.plan;
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [entries, total, totalAll, thisWeek, convertedCount] = await Promise.all([
    prisma.waitlistEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.waitlistEntry.count({ where }),
    prisma.waitlistEntry.count(),
    prisma.waitlistEntry.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.waitlistEntry.count({ where: { convertedAt: { not: null } } }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const conversionRate = totalAll > 0 ? ((convertedCount / totalAll) * 100).toFixed(1) : "0.0";

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    if (params.converted) p.set("converted", params.converted);
    if (params.plan) p.set("plan", params.plan);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    return `/admin/waitlist?${p.toString()}`;
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        Waitlist
      </h1>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Total Entries
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>{totalAll}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            This Week
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>{thisWeek}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Converted
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e" }}>{convertedCount}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
            Conversion Rate
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>{conversionRate}%</div>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" action="/admin/waitlist" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <select
          name="converted"
          defaultValue={params.converted || ""}
          style={{
            padding: "8px 12px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary, #2a2a2a)",
            borderRadius: 6,
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          <option value="">All Entries</option>
          <option value="yes">Converted</option>
          <option value="no">Not Converted</option>
        </select>
        <select
          name="plan"
          defaultValue={params.plan || "ALL"}
          style={{
            padding: "8px 12px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary, #2a2a2a)",
            borderRadius: 6,
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          <option value="ALL">All Plans</option>
          <option value="FREE">FREE</option>
          <option value="PRO">PRO</option>
          <option value="AGENCY">AGENCY</option>
        </select>
        <button
          type="submit"
          style={{
            padding: "8px 20px",
            background: "var(--accent-blue)",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Filter
        </button>
      </form>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
              {["Email", "Name", "Company", "Plan Interest", "Timezone", "Source", "Signed Up", "Status"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                <td style={{ padding: "12px", color: "var(--text-primary)" }}>{entry.email}</td>
                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{entry.name || "-"}</td>
                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{entry.company || "-"}</td>
                <td style={{ padding: "12px" }}>
                  {entry.planInterest ? (
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: tierColor[entry.planInterest] || "#6b7280",
                      color: "#fff",
                    }}>
                      {entry.planInterest}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-secondary)" }}>-</span>
                  )}
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: 12 }}>{entry.timezone || "-"}</td>
                <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: 12 }}>{entry.source || "-"}</td>
                <td style={{ padding: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {relativeTime(entry.createdAt)}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: entry.convertedAt ? "#22c55e" : "#6b7280",
                    color: "#fff",
                  }}>
                    {entry.convertedAt ? "Converted" : "Waiting"}
                  </span>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                  No waitlist entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24 }}>
          {page > 1 && (
            <a href={buildUrl({ page: String(page - 1) })} style={{ padding: "6px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary, #2a2a2a)", borderRadius: 6, color: "var(--text-primary)", textDecoration: "none", fontSize: 13 }}>
              Previous
            </a>
          )}
          <span style={{ padding: "6px 14px", fontSize: 13, color: "var(--text-secondary)" }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a href={buildUrl({ page: String(page + 1) })} style={{ padding: "6px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary, #2a2a2a)", borderRadius: 6, color: "var(--text-primary)", textDecoration: "none", fontSize: 13 }}>
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
