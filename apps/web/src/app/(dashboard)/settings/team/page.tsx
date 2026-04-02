import { prisma } from "@/lib/db";
import { getSessionOrg } from "@/lib/auth";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false },
};

export default async function TeamPage() {
  const orgId = await getSessionOrg();

  const members = await prisma.membership.findMany({
    where: { orgId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const pendingInvites = await prisma.invitation.findMany({
    where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Team"
        subtitle={`${members.length} member${members.length !== 1 ? "s" : ""}`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Settings", href: "/settings/connections" },
          { label: "Team" },
        ]}
      />

      <div className="section-label mb-3">Members</div>
      <div className="space-y-1 mb-8">
        {members.map((m) => (
          <div key={m.id} className="table-row flex items-center justify-between px-3 sm:px-4 py-3 rounded-lg gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "var(--accent-blue-muted)", color: "var(--accent-blue)" }}>
                {(m.user.name?.[0] ?? m.user.email[0] ?? "?").toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{m.user.name ?? m.user.email}</div>
                <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{m.user.email}</div>
              </div>
            </div>
            <span className={`badge flex-shrink-0 ${m.role === "OWNER" ? "badge-info" : m.role === "ADMIN" ? "badge-purple" : "badge-neutral"}`}>
              {m.role}
            </span>
          </div>
        ))}
      </div>

      {pendingInvites.length > 0 && (
        <>
          <div className="section-label mb-3">Pending Invitations</div>
          <div className="space-y-1">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="table-row flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-4 py-3 rounded-lg gap-1 sm:gap-2">
                <div className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>{inv.email}</div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="badge badge-warning">{inv.role}</span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Expires {inv.expiresAt.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
