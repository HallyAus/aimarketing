import { prisma } from "@adpilot/db";
import { getSessionOrg } from "@/lib/auth";
import { PLAN_LIMITS } from "@adpilot/shared";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false },
};

export default async function BillingPage() {
  const orgId = await getSessionOrg();
  const org = await prisma.organization.findFirst({ where: { id: orgId } });
  const plan = org?.plan ?? "FREE";
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

  const connectionCount = await prisma.platformConnection.count({ where: { orgId } });
  const memberCount = await prisma.membership.count({ where: { orgId } });

  return (
    <div>
      <PageHeader title="Billing" subtitle="Manage your subscription and usage" />

      {/* Current plan */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="section-label mb-1">Current Plan</div>
            <div className="text-xl font-bold" style={{ color: "var(--accent-blue)" }}>{plan}</div>
          </div>
          {plan === "FREE" && <a href="/api/billing/checkout" className="btn-primary">Upgrade</a>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4" style={{ borderTop: "1px solid var(--border-secondary)" }}>
          <div>
            <div className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Platforms</div>
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {connectionCount} / {limits.maxPlatformConnections === Infinity ? "Unlimited" : limits.maxPlatformConnections}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Team Members</div>
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {memberCount} / {limits.maxTeamMembers === Infinity ? "Unlimited" : limits.maxTeamMembers}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Posts/month</div>
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {limits.maxPostsPerMonth === Infinity ? "Unlimited" : limits.maxPostsPerMonth}
            </div>
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="section-label mb-3">Available Plans</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["FREE", "PRO", "AGENCY"] as const).map((p) => {
          const l = PLAN_LIMITS[p];
          const isCurrent = p === plan;
          const prices: Record<string, string> = { FREE: "$0", PRO: "$49/mo", AGENCY: "$149/mo" };
          return (
            <div key={p} className="card" style={isCurrent ? { borderColor: "var(--accent-blue)" } : {}}>
              <div className="text-sm font-bold mb-1" style={{ color: isCurrent ? "var(--accent-blue)" : "var(--text-primary)" }}>{p}</div>
              <div className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>{prices[p]}</div>
              <div className="space-y-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <div>{l.maxPlatformConnections === Infinity ? "Unlimited" : l.maxPlatformConnections} platforms</div>
                <div>{l.maxPostsPerMonth === Infinity ? "Unlimited" : l.maxPostsPerMonth} posts/month</div>
                <div>{l.maxTeamMembers === Infinity ? "Unlimited" : l.maxTeamMembers} team members</div>
                {l.hasApprovalWorkflow && <div>Approval workflow</div>}
                {l.hasAiInsights && <div>AI insights</div>}
                {l.hasWhiteLabel && <div>White-label</div>}
              </div>
              {isCurrent ? (
                <div className="mt-4 text-xs font-medium text-center py-1.5 rounded-lg" style={{ background: "var(--accent-blue-muted)", color: "var(--accent-blue)" }}>Current Plan</div>
              ) : (
                <button className="btn-secondary w-full mt-4 text-xs">
                  {p === "FREE" ? "Downgrade" : "Upgrade"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
