import { prisma } from "@/lib/db";
import Link from "next/link";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false },
};

/* SVG icon helpers */
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function SparklesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}
function RocketIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3M22 2l-7.5 10.5M9.344 11.652l-3.249 3.249a.5.5 0 00-.105.552l1.06 2.651 5.25-5.252M12.348 14.656l3.249-3.249a.5.5 0 00.105-.552l-1.06-2.651-5.25 5.252" />
    </svg>
  );
}

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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <EmptyState
          icon={<RocketIcon />}
          title="Welcome to AdPilot"
          description="Create your first organization to get started."
          action={<Link href="/onboarding" className="btn-primary">Get Started</Link>}
        />
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
        breadcrumbs={[{ label: "Home", href: "/dashboard" }]}
      />

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Platforms" value={org._count.platformConnections} accent="var(--accent-blue)" />
        <MetricCard label="Campaigns" value={org._count.campaigns} accent="var(--accent-purple)" />
        <MetricCard label="Scheduled" value={scheduledCount} accent="var(--accent-amber)" />
        <MetricCard label="Pending Review" value={pendingCount} accent="var(--accent-red)" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/campaigns/new" className="card card-hover flex items-center gap-3 no-underline">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-blue-muted)", color: "var(--accent-blue)" }}>
            <PlusIcon />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>New Campaign</div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Create and schedule posts</div>
          </div>
        </Link>
        <Link href="/ai" className="card card-hover flex items-center gap-3 no-underline">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-purple-muted)", color: "var(--accent-purple)" }}>
            <SparklesIcon />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>AI Studio</div>
            <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Generate content with AI</div>
          </div>
        </Link>
        <Link href="/settings/connections" className="card card-hover flex items-center gap-3 no-underline">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-emerald-muted)", color: "var(--accent-emerald)" }}>
            <LinkIcon />
          </div>
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
          <EmptyState
            title="No published posts yet"
            description="Create a campaign to get started."
          />
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
