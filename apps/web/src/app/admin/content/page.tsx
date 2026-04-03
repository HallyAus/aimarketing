import { prisma } from "@/lib/db";
import { relativeTime } from "../components/relative-time";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Content Management | Admin" };

const PLATFORMS = ["ALL", "FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "GOOGLE_ADS", "YOUTUBE", "PINTEREST", "SNAPCHAT"] as const;
const STATUSES = ["ALL", "DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED", "DELETED"] as const;

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
  DRAFT: "#6b7280",
  PENDING_APPROVAL: "#f59e0b",
  APPROVED: "#10b981",
  REJECTED: "#ef4444",
  SCHEDULED: "#3b82f6",
  PUBLISHING: "#8b5cf6",
  PUBLISHED: "#22c55e",
  FAILED: "#ef4444",
  DELETED: "#6b7280",
};

interface Props {
  searchParams: Promise<{
    search?: string;
    platform?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function ContentPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params.search) {
    where.content = { contains: params.search, mode: "insensitive" };
  }
  if (params.platform && params.platform !== "ALL") {
    where.platform = params.platform;
  }
  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }
  if (params.from || params.to) {
    where.createdAt = {
      ...(params.from ? { gte: new Date(params.from) } : {}),
      ...(params.to ? { lte: new Date(params.to + "T23:59:59Z") } : {}),
    };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: {
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    if (params.search) p.set("search", params.search);
    if (params.platform) p.set("platform", params.platform);
    if (params.status) p.set("status", params.status);
    if (params.from) p.set("from", params.from);
    if (params.to) p.set("to", params.to);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    return `/admin/content?${p.toString()}`;
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 24 }}>
        Content Management
      </h1>

      {/* Filters */}
      <form method="GET" action="/admin/content" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <input
          name="search"
          type="text"
          placeholder="Search content..."
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
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s.replace("_", " ")}</option>
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
        {total} post{total !== 1 ? "s" : ""} found
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
              {["Content", "Organization", "Platform", "Status", "Date", "Actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-secondary)", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} style={{ borderBottom: "1px solid var(--border-primary, #2a2a2a)" }}>
                <td style={{ padding: "12px", color: "var(--text-primary)", maxWidth: 300 }}>
                  {post.content.length > 100 ? post.content.slice(0, 100) + "..." : post.content}
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                  {post.organization.name}
                </td>
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
                <td style={{ padding: "12px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: statusColor[post.status] || "#6b7280",
                    color: "#fff",
                  }}>
                    {post.status.replace("_", " ")}
                  </span>
                </td>
                <td style={{ padding: "12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                  {relativeTime(post.publishedAt || post.scheduledAt || post.createdAt)}
                </td>
                <td style={{ padding: "12px" }}>
                  <a
                    href={`/admin/content/${post.id}`}
                    style={{ color: "var(--accent-blue)", textDecoration: "none", fontSize: 13 }}
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
                  No posts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
