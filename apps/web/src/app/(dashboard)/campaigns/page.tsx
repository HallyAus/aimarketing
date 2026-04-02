import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = {
  title: "Campaigns",
  robots: { index: false },
};

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    where: { orgId: await getSessionOrg() },
    include: {
      _count: { select: { posts: true } },
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Campaigns"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Campaigns" },
        ]}
        action={
          <Link href="/campaigns/new" className="btn-primary text-sm">
            New Campaign
          </Link>
        }
      />

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Create your first campaign to start publishing content."
          action={
            <Link href="/campaigns/new" className="btn-primary text-sm">
              Create your first campaign
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="card card-hover block"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate" style={{ color: "var(--text-primary)" }}>{c.name}</div>
                  <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    {c.objective} &middot; {c._count.posts} posts &middot; by {c.creator?.name ?? "Unknown"}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={c.status} />
                  {c.targetPlatforms.length > 0 && (
                    <span className="text-xs hidden sm:inline" style={{ color: "var(--text-tertiary)" }}>
                      {c.targetPlatforms.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
