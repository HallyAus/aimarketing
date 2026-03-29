import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";
import Link from "next/link";

const POST_STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-neutral",
  PENDING_APPROVAL: "badge-warning",
  APPROVED: "badge-info",
  REJECTED: "badge-error",
  SCHEDULED: "badge-info",
  PUBLISHING: "badge-warning",
  PUBLISHED: "badge-success",
  FAILED: "badge-error",
  DELETED: "badge-neutral",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: await getOrgId() },
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        include: { approver: { select: { name: true } } },
      },
      creator: { select: { name: true } },
    },
  });

  if (!campaign) redirect("/campaigns");

  const isAdminOrOwner = ["ADMIN", "OWNER"].includes("OWNER");

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{campaign.name}</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {campaign.objective} &middot; {campaign.status} &middot; {campaign.targetPlatforms.join(", ")}
          </p>
        </div>
        <Link
          href={`/campaigns/${campaignId}/posts/new`}
          className="btn-primary text-sm min-h-[44px] inline-flex items-center justify-center"
        >
          Add Post
        </Link>
      </div>

      {campaign.posts.length === 0 ? (
        <p style={{ color: "var(--text-secondary)" }}>No posts yet. Add your first post to this campaign.</p>
      ) : (
        <div className="space-y-3">
          {campaign.posts.map((post) => (
            <div key={post.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{post.platform}</span>
                  <span className={POST_STATUS_BADGE[post.status] ?? "badge-neutral"}>
                    {post.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {post.status === "PENDING_APPROVAL" && isAdminOrOwner && (
                    <>
                      <form action={async () => {
                        "use server";
                        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/posts/${post.id}/approve`, { method: "POST" });
                        const { redirect: r } = await import("next/navigation");
                        r(`/campaigns/${campaignId}`);
                      }}>
                        <button type="submit" className="btn-primary text-xs px-4 py-2 min-h-[44px]">Approve</button>
                      </form>
                      <form action={async () => {
                        "use server";
                        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/posts/${post.id}/reject`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ reason: "Needs revision" }),
                        });
                        const { redirect: r } = await import("next/navigation");
                        r(`/campaigns/${campaignId}`);
                      }}>
                        <button type="submit" className="btn-danger text-xs px-4 py-2 min-h-[44px]">Reject</button>
                      </form>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                {post.content.substring(0, 300)}{post.content.length > 300 ? "..." : ""}
              </p>
              {post.rejectionReason && (
                <p className="text-sm mt-2" style={{ color: "var(--accent-red)" }}>
                  Rejection reason: {post.rejectionReason}
                </p>
              )}
              {post.scheduledAt && (
                <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
                  Scheduled: {post.scheduledAt.toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
