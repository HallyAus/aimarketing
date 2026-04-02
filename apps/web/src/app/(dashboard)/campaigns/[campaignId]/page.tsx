import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CampaignPostsManager from "./campaign-posts-manager";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: await getSessionOrg() },
    include: {
      posts: {
        orderBy: { createdAt: "desc" },
        include: { approver: { select: { name: true } } },
      },
      creator: { select: { name: true } },
    },
  });

  if (!campaign) redirect("/campaigns");

  // Serialize for client component (Dates → strings, Decimal → number)
  const serialized = {
    id: campaign.id,
    name: campaign.name,
    objective: campaign.objective,
    status: campaign.status,
    targetPlatforms: campaign.targetPlatforms as string[],
    creator: campaign.creator,
    posts: campaign.posts.map((p) => ({
      id: p.id,
      platform: p.platform as string,
      content: p.content,
      status: p.status as string,
      scheduledAt: p.scheduledAt?.toISOString() ?? null,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      platformPostId: p.platformPostId ?? null,
      rejectionReason: p.rejectionReason ?? null,
      errorMessage: p.errorMessage ?? null,
      pageId: p.pageId ?? null,
      pageName: p.pageName ?? null,
      version: p.version,
      createdAt: p.createdAt.toISOString(),
      approver: p.approver,
    })),
  };

  return <CampaignPostsManager campaign={serialized} />;
}
