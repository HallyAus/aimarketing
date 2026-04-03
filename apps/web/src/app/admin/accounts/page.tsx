import { prisma } from "@/lib/db";
import { relativeTime } from "../components/relative-time";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Connected Accounts | Admin" };

const PLATFORMS = ["ALL", "FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "GOOGLE_ADS", "YOUTUBE", "PINTEREST", "SNAPCHAT"] as const;
const CONNECTION_STATUSES = ["ALL", "ACTIVE", "EXPIRED", "REVOKED"] as const;

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

const statusColor: Record<string, string> = {
  ACTIVE: "#22c55e",
  EXPIRED: "#f59e0b",
  REVOKED: "#ef4444",
};

interface Props {
  searchParams: Promise<{
    platform?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AccountsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (params.platform && params.platform !== "ALL") {
    where.platform = params.platform;
  }
  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  const [connections, total] = await Promise.all([
    prisma.platformConnection.findMany({
      where,
      include: {
        organization: { select: { name: true } },
        connector: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.platformConnection.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        Connected Accounts
      </h1>

      <form method="GET" action="/admin/accounts" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <select
          name="platform"
          defaultValue={params.platform || "ALL"}
          style={{
            padding: "8px 12px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary, #2a2a2a)",
            borderRadius: 6,
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{p === "ALL" ? "All Platforms" : p.replace("_", " ")}</option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={params.status || "ALL"}
          style={{
            padding: "8px 12px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary, #2a2a2a)",
            borderRadius: 6,
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          {CONNECTION_STATUSES.map((s) => (
            <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</option>
          ))}
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

      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
        {total} connection{total !== 1 ? "s" : ""} found
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
              {["Organization", "Platform", "Account Name", "Status", "Token Expires", "Connected By", "Last Updated"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {connections.map((conn) => (
              <tr key={conn.id} style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                <td style={{ padding: "12px", color: "var(--text-primary)" }}>
                  {conn.organization.name}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: platformColor[conn.platform] || "#6b7280",
                    color: conn.platform === "SNAPCHAT" ? "#000" : "#fff",
                  }}>
                    {conn.platform.replace("_", " ")}
                  </span>
                </td>
                <td style={{ padding: "12px", color: "var(--text-primary)" }}>
                  {conn.platformAccountName || conn.platformUserId}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: statusColor[conn.status] || "#6b7280",
                    color: "#fff",
                  }}>
                    {conn.status}
                  </span>
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {conn.tokenExpiresAt ? relativeTime(conn.tokenExpiresAt) : "N/A"}
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                  {conn.connector.name || conn.connector.email}
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {relativeTime(conn.updatedAt)}
                </td>
              </tr>
            ))}
            {connections.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                  No connections found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24 }}>
          {page > 1 && (
            <a href={`/admin/accounts?platform=${params.platform || "ALL"}&status=${params.status || "ALL"}&page=${page - 1}`} style={{ padding: "6px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary, #2a2a2a)", borderRadius: 6, color: "var(--text-primary)", textDecoration: "none", fontSize: 13 }}>
              Previous
            </a>
          )}
          <span style={{ padding: "6px 14px", fontSize: 13, color: "var(--text-secondary)" }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <a href={`/admin/accounts?platform=${params.platform || "ALL"}&status=${params.status || "ALL"}&page=${page + 1}`} style={{ padding: "6px 14px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary, #2a2a2a)", borderRadius: 6, color: "var(--text-primary)", textDecoration: "none", fontSize: 13 }}>
              Next
            </a>
          )}
        </div>
      )}
    </div>
  );
}
