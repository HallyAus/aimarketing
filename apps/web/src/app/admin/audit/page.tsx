import { prisma } from "@/lib/db";
import { relativeTime } from "../components/relative-time";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audit Log | Admin" };

interface Props {
  searchParams: Promise<{
    search?: string;
    action?: string;
    userId?: string;
    orgId?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function AuditPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params.search) {
    where.OR = [
      { action: { contains: params.search, mode: "insensitive" } },
      { user: { name: { contains: params.search, mode: "insensitive" } } },
      { user: { email: { contains: params.search, mode: "insensitive" } } },
    ];
  }
  if (params.action) {
    where.action = params.action;
  }
  if (params.userId) {
    where.userId = params.userId;
  }
  if (params.orgId) {
    where.orgId = params.orgId;
  }
  if (params.from || params.to) {
    where.createdAt = {
      ...(params.from ? { gte: new Date(params.from) } : {}),
      ...(params.to ? { lte: new Date(params.to + "T23:59:59Z") } : {}),
    };
  }

  const [logs, total, actionTypes] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    if (params.search) p.set("search", params.search);
    if (params.action) p.set("action", params.action);
    if (params.userId) p.set("userId", params.userId);
    if (params.orgId) p.set("orgId", params.orgId);
    if (params.from) p.set("from", params.from);
    if (params.to) p.set("to", params.to);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    return `/admin/audit?${p.toString()}`;
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        Audit Log
      </h1>

      <form method="GET" action="/admin/audit" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <input
          name="search"
          type="text"
          placeholder="Search action or user..."
          defaultValue={params.search || ""}
          style={{
            padding: "8px 12px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary, #2a2a2a)",
            borderRadius: 6,
            color: "var(--text-primary)",
            fontSize: 14,
            minWidth: 200,
          }}
        />
        <select
          name="action"
          defaultValue={params.action || ""}
          style={{
            padding: "8px 12px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary, #2a2a2a)",
            borderRadius: 6,
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          <option value="">All Actions</option>
          {actionTypes.map((a) => (
            <option key={a.action} value={a.action}>{a.action}</option>
          ))}
        </select>
        <input
          name="from"
          type="date"
          defaultValue={params.from || ""}
          style={{
            padding: "8px 12px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary, #2a2a2a)",
            borderRadius: 6,
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        />
        <input
          name="to"
          type="date"
          defaultValue={params.to || ""}
          style={{
            padding: "8px 12px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary, #2a2a2a)",
            borderRadius: 6,
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        />
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
        {total} log entr{total !== 1 ? "ies" : "y"} found
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
              {["Timestamp", "User", "Action", "Entity Type", "Entity ID", "Organization", "IP"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                <td style={{ padding: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {relativeTime(log.createdAt)}
                </td>
                <td style={{ padding: "12px" }}>
                  {log.user ? (
                    <div>
                      <div style={{ color: "var(--text-primary)", fontSize: 13 }}>{log.user.name || "Unknown"}</div>
                      <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>{log.user.email}</div>
                    </div>
                  ) : (
                    <span style={{ color: "var(--text-secondary)" }}>System</span>
                  )}
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: "var(--accent-blue)",
                    color: "#fff",
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: "12px", color: "var(--text-primary)" }}>{log.entityType}</td>
                <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: 12, fontFamily: "monospace" }}>
                  {log.entityId.slice(0, 12)}...
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                  {log.organization?.name || "-"}
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: 12, fontFamily: "monospace" }}>
                  {log.ipAddress || "-"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                  No audit logs found
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
