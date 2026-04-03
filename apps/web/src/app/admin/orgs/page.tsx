import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    plan?: string;
    status?: string;
    page?: string;
  }>;
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

export default async function OrgsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const planFilter = params.plan ?? "ALL";
  const statusFilter = params.status ?? "ALL";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 25;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { deletedAt: null };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const validPlans = ["FREE", "PRO", "AGENCY"];
  if (planFilter !== "ALL" && validPlans.includes(planFilter)) {
    where.plan = planFilter;
  }

  const validStatuses = ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED", "UNPAID", "INCOMPLETE", "PAUSED"];
  if (statusFilter !== "ALL" && validStatuses.includes(statusFilter)) {
    where.subscriptionStatus = statusFilter;
  }

  const [orgs, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        subscriptionStatus: true,
        billingCycle: true,
        postsUsedThisMonth: true,
        maxPostsPerMonth: true,
        createdAt: true,
        _count: {
          select: {
            memberships: true,
            platformConnections: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.organization.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Organizations</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
            {total} total organizations
          </p>
        </div>
      </div>

      {/* Filters */}
      <form
        method="GET"
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <input
          name="search"
          type="text"
          placeholder="Search by name or slug..."
          defaultValue={search}
          style={{
            padding: "8px 12px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
            fontSize: 14,
            minWidth: 250,
          }}
        />
        <select
          name="plan"
          defaultValue={planFilter}
          style={{
            padding: "8px 12px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          <option value="ALL">All Plans</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="AGENCY">Agency</option>
        </select>
        <select
          name="status"
          defaultValue={statusFilter}
          style={{
            padding: "8px 12px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
            fontSize: 14,
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAST_DUE">Past Due</option>
          <option value="CANCELED">Canceled</option>
          <option value="TRIALING">Trialing</option>
          <option value="UNPAID">Unpaid</option>
        </select>
        <button
          type="submit"
          style={{
            padding: "8px 20px",
            background: "var(--accent-blue)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-primary)",
          overflow: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--border-primary)",
                textAlign: "left",
              }}
            >
              {["Name", "Plan", "Status", "Cycle", "Members", "Platforms", "Posts", "Created", ""].map(
                (h) => (
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
                )
              )}
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => {
              const pc = planColors[org.plan] || { bg: "var(--bg-hover)", text: "var(--text-secondary)" };
              const sc = statusColors[org.subscriptionStatus] || { bg: "var(--bg-hover)", text: "var(--text-secondary)" };
              return (
                <tr
                  key={org.id}
                  style={{ borderBottom: "1px solid var(--border-secondary)" }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{org.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{org.slug}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: pc.bg,
                        color: pc.text,
                      }}
                    >
                      {org.plan}
                    </span>
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
                      {org.subscriptionStatus}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                    {org.billingCycle}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                    {org._count.memberships}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                    {org._count.platformConnections}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                    {org.postsUsedThisMonth} / {org.maxPostsPerMonth}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--text-tertiary)", fontSize: 13 }}>
                    {new Date(org.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Link
                      href={`/admin/orgs/${org.id}`}
                      style={{
                        color: "var(--accent-blue)",
                        textDecoration: "none",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {orgs.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--text-tertiary)",
                  }}
                >
                  No organizations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 24,
          }}
        >
          {page > 1 && (
            <Link
              href={`/admin/orgs?search=${search}&plan=${planFilter}&status=${statusFilter}&page=${page - 1}`}
              style={{
                padding: "8px 16px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Previous
            </Link>
          )}
          <span
            style={{
              padding: "8px 16px",
              color: "var(--text-secondary)",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
            }}
          >
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/orgs?search=${search}&plan=${planFilter}&status=${statusFilter}&page=${page + 1}`}
              style={{
                padding: "8px 16px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
