import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";
import Link from "next/link";

const POST_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  SCHEDULED: "bg-indigo-100 text-indigo-800",
  PUBLISHING: "bg-orange-100 text-orange-800",
  PUBLISHED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.currentOrgId) redirect("/org-picker");

  const { campaignId } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: session.user.currentOrgId },
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        include: { approver: { select: { name: true } } },
      },
      creator: { select: { name: true } },
    },
  });

  if (!campaign) redirect("/campaigns");

  const isAdminOrOwner = ["ADMIN", "OWNER"].includes(session.user.currentRole ?? "");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {campaign.objective} &middot; {campaign.status} &middot; {campaign.targetPlatforms.join(", ")}
          </p>
        </div>
        <Link
          href={`/campaigns/${campaignId}/posts/new`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Post
        </Link>
      </div>

      {campaign.posts.length === 0 ? (
        <p className="text-gray-500">No posts yet. Add your first post to this campaign.</p>
      ) : (
        <div className="space-y-3">
          {campaign.posts.map((post) => (
            <div key={post.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{post.platform}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${POST_STATUS_COLORS[post.status] ?? ""}`}>
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
                        <button type="submit" className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Approve</button>
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
                        <button type="submit" className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Reject</button>
                      </form>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm">{post.content.substring(0, 300)}{post.content.length > 300 ? "..." : ""}</p>
              {post.rejectionReason && (
                <p className="text-sm text-red-500 mt-2">Rejection reason: {post.rejectionReason}</p>
              )}
              {post.scheduledAt && (
                <p className="text-xs text-gray-400 mt-2">Scheduled: {post.scheduledAt.toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
