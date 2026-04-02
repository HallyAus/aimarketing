import { prisma } from "@/lib/db";
import Link from "next/link";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

export default async function DashboardPage() {
  const org = await prisma.organization.findFirst({
    where: { deletedAt: null },
    include: {
      _count: {
        select: {
          platformConnections: true,
          campaigns: true,
          memberships: true,
        },
      },
    },
  });

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-2xl" style={{ background: "var(--accent-blue-muted)", color: "var(--accent-blue)" }}>
          +
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Welcome to AdPilot</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Create your first organization to get started.</p>
        <Link href="/onboarding" className="btn-primary">Get Started</Link>
      </div>
    );
  }

  const recentPosts = await prisma.post.findMany({
    where: { orgId: org.id, status: "PUBLISHED" },
    include: { campaign: { select: { name: true } } },
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  const scheduledCount = await prisma.post.count({
    where: { orgId: org.id, status: "SCHEDULED" },
  });

  const pendingCount = await prisma.post.count({
    where: { orgId: org.id, status: "PENDING_APPROVAL" },
  });

  return (
    <div>
      <PageHeader
        title={org.name}
        subtitle="Organization overview"
        action={<span className="badge badge-info">{org.plan}</span>}
      />

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <MetricCard label="Platforms" value={org._count.platformConnections} accent="var(--accent-blue)" />
        <MetricCard label="Campaigns" value={org._count.campaigns} accent="var(--accent-purple)" />
        <MetricCard label="Scheduled" value={scheduledCount} accent="var(--accent-amber)" />
        <MetricCard label="Pending Review" value={pendingCount} accent="var(--accent-red)" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <Link href="/campaigns/new" className="card card-hover flex items-center gap-3 no-underline">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm" style={{ background: "var(--accent-blue-muted)", color: "var(--accent-blue)" }}>+</div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>New Campaign</div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Create and schedule posts</div>
          </div>
        </Link>
        <Link href="/ai" className="card card-hover flex items-center gap-3 no-underline">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm" style={{ background: "var(--accent-purple-muted)", color: "var(--accent-purple)" }}>AI</div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>AI Studio</div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Generate content with AI</div>
          </div>
        </Link>
        <Link href="/settings/connections" className="card card-hover flex items-center gap-3 no-underline">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm" style={{ background: "var(--accent-emerald-muted)", color: "var(--accent-emerald)" }}>9</div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Connect Platforms</div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Link social accounts</div>
          </div>
        </Link>
      </div>

      {/* Recent activity */}
      <div>
        <div className="section-label mb-3">Recent Posts</div>
        {recentPosts.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No published posts yet. Create a campaign to get started.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentPosts.map((post) => (
              <div key={post.id} className="table-row flex items-center justify-between px-3 py-2.5 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="badge badge-info text-[10px]">{post.platform}</span>
                  <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{post.content.substring(0, 80)}</span>
                </div>
                <div className="text-xs whitespace-nowrap ml-3" style={{ color: "var(--text-tertiary)" }}>
                  {post.campaign?.name ?? "Draft"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
