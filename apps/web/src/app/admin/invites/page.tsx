import { prisma } from "@/lib/db";
import { relativeTime } from "../components/relative-time";
import { InviteFilters } from "./invite-filters";
import type { Prisma } from "@adpilot/db";

const PAGE_SIZE = 25;

function statusColor(status: string): string {
  switch (status) {
    case "PENDING":
      return "#e5a100";
    case "ACCEPTED":
      return "#30a46c";
    case "DECLINED":
      return "#6b7280";
    case "CANCELLED":
      return "#6b7280";
    case "EXPIRED":
      return "#e5484d";
    default:
      return "#6b7280";
  }
}

export default async function InvitesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const page = Math.max(
    1,
    parseInt(typeof params.page === "string" ? params.page : "1", 10),
  );

  const where: Prisma.InvitationWhereInput = {};
  if (status === "ACCEPTED") {
    where.acceptedAt = { not: null };
  } else if (status === "PENDING") {
    where.acceptedAt = null;
    where.expiresAt = { gt: new Date() };
  } else if (status === "EXPIRED") {
    where.acceptedAt = null;
    where.expiresAt = { lt: new Date() };
  }

  const [invitations, total] = await Promise.all([
    prisma.invitation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        organization: { select: { id: true, name: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.invitation.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Invitations
        </h1>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {total} invitation{total !== 1 ? "s" : ""}
        </span>
      </div>

      <InviteFilters />

      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: 8,
          border: "1px solid var(--border-primary, #2a2a2a)",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Organization</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}>Invited By</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Sent</th>
              <th style={thStyle}>Expires</th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    ...tdStyle,
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    padding: 32,
                  }}
                >
                  No invitations found.
                </td>
              </tr>
            ) : (
              invitations.map((inv) => (
                <tr key={inv.id}>
                  <td style={tdStyle}>{inv.email}</td>
                  <td style={tdStyle}>{inv.organization.name}</td>
                  <td style={tdStyle}>
                    <span style={badgeStyle("var(--accent-purple, #6b4fbb)")}>
                      {inv.role}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: 13 }}>
                      {inv.inviter.name ?? inv.inviter.email}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(statusColor(inv.acceptedAt ? "ACCEPTED" : inv.expiresAt < new Date() ? "EXPIRED" : "PENDING"))}>
                      {inv.acceptedAt ? "ACCEPTED" : inv.expiresAt < new Date() ? "EXPIRED" : "PENDING"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>
                    {relativeTime(inv.createdAt)}
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12 }}>
                    {inv.expiresAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))
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
            marginTop: 20,
          }}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/invites?${new URLSearchParams({
                ...(status ? { status } : {}),
                page: String(p),
              }).toString()}`}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                background:
                  p === page ? "var(--accent-blue)" : "var(--bg-secondary)",
                color: p === page ? "#fff" : "var(--text-secondary)",
                border: "1px solid var(--border-primary, #2a2a2a)",
              }}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
