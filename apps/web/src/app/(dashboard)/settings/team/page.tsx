import { prisma } from "@adpilot/db";
import { getOrgId } from "@/lib/get-org";

export default async function TeamPage() {
  const orgId = await getOrgId();

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Team</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="section-label mb-3">Members</div>
      <div className="space-y-1 mb-8">
        {members.map((m) => (
          <div key={m.id} className="table-row flex items-center justify-between px-4 py-3 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent-blue-muted)", color: "var(--accent-blue)" }}>
                {(m.user.name?.[0] ?? m.user.email[0] ?? "?").toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.user.name ?? m.user.email}</div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.user.email}</div>
              </div>
            </div>
            <span className={`badge ${m.role === "OWNER" ? "badge-info" : m.role === "ADMIN" ? "badge-purple" : "badge-neutral"}`}>
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
              <div key={inv.id} className="table-row flex items-center justify-between px-4 py-3 rounded-lg">
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{inv.email}</div>
                <div className="flex items-center gap-2">
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
