import { prisma } from "@/lib/db";
import { relativeTime } from "../components/relative-time";
import { UserFilters } from "./components/user-filters";
import { Pagination } from "./components/pagination";
import Link from "next/link";
import type { Prisma } from "@reachpilot/db";

const PAGE_SIZE = 25;

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "#30a46c";
    case "SUSPENDED":
      return "#e5a100";
    case "BANNED":
      return "#e5484d";
    case "PENDING_VERIFICATION":
      return "#6b7280";
    case "DEACTIVATED":
      return "#6b7280";
    default:
      return "#6b7280";
  }
}

function roleColor(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "var(--accent-blue)";
    case "ADMIN":
      return "#6b4fbb";
    default:
      return "var(--bg-primary)";
  }
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const role = typeof params.role === "string" ? params.role : "";
  const plan = typeof params.plan === "string" ? params.plan : "";
  const page = Math.max(1, parseInt(typeof params.page === "string" ? params.page : "1", 10));

  // Build the where clause
  const where: Prisma.UserWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status && status !== "ALL") {
    where.status = status as Prisma.EnumUserStatusFilter;
  }

  if (role && role !== "ALL") {
    where.systemRole = role as Prisma.EnumSystemRoleFilter;
  }

  if (plan && plan !== "ALL") {
    where.memberships = {
      some: {
        organization: {
          plan: plan as "FREE" | "PRO" | "AGENCY",
          deletedAt: null,
        },
      },
    };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        status: true,
        systemRole: true,
        timezone: true,
        lastLoginAt: true,
        loginCount: true,
        createdAt: true,
        memberships: {
          select: {
            role: true,
            organization: {
              select: { id: true, name: true, plan: true },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border-primary, #2a2a2a)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: 13,
    color: "var(--text-primary)",
    borderBottom: "1px solid var(--border-primary, #2a2a2a)",
  };

  const badgeStyle = (bg: string): React.CSSProperties => ({
    display: "inline-block",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
    background: bg,
    color: "#fff",
    fontWeight: 600,
    textTransform: "uppercase",
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>Users</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {total} user{total !== 1 ? "s" : ""}
          </span>
          <Link
            href="/admin/users/create"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "var(--accent-blue)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Create User
          </Link>
        </div>
      </div>

      <UserFilters />

      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: 8,
          border: "1px solid var(--border-primary, #2a2a2a)",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
          <thead>
            <tr>
              <th style={thStyle}>Name / Email</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Organization</th>
              <th style={thStyle}>Plan</th>
              <th style={thStyle}>Timezone</th>
              <th style={thStyle}>Last Login</th>
              <th style={thStyle}>Logins</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ ...tdStyle, textAlign: "center", color: "var(--text-secondary)", padding: 32 }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const primaryOrg = user.memberships[0]?.organization;
                return (
                  <tr key={user.id}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{user.name ?? "—"}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{user.email}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(statusColor(user.status))}>{user.status}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(roleColor(user.systemRole))}>{user.systemRole.replace("_", " ")}</span>
                    </td>
                    <td style={tdStyle}>
                      {user.memberships.length > 0
                        ? user.memberships.map((m) => m.organization.name).join(", ")
                        : "—"}
                    </td>
                    <td style={tdStyle}>{primaryOrg?.plan ?? "—"}</td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>{user.timezone}</td>
                    <td style={tdStyle}>{relativeTime(user.lastLoginAt)}</td>
                    <td style={tdStyle}>{user.loginCount}</td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>
                      {user.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td style={tdStyle}>
                      <Link
                        href={`/admin/users/${user.id}`}
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
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination total={total} pageSize={PAGE_SIZE} />
    </div>
  );
}
