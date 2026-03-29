import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-neutral",
  SCHEDULED: "badge-info",
  ACTIVE: "badge-success",
  PAUSED: "badge-warning",
  COMPLETED: "badge-purple",
  FAILED: "badge-error",
  DELETED: "badge-neutral",
};

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    where: { orgId: await getOrgId() },
    include: {
      _count: { select: { posts: true } },
      creator: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Campaigns</h1>
        <Link href="/campaigns/new" className="btn-primary text-sm">
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: "var(--text-secondary)" }}>No campaigns yet.</p>
          <Link
            href="/campaigns/new"
            className="mt-2 inline-block text-sm"
            style={{ color: "var(--accent-blue)" }}
          >
            Create your first campaign
          </Link>
        </div>
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
                  <span className={STATUS_BADGE[c.status] ?? "badge-neutral"}>
                    {c.status}
                  </span>
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
