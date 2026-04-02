import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { PostForm } from "@/components/post-form";

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: await getSessionOrg() },
    select: { id: true, name: true, targetPlatforms: true },
  });
  if (!campaign) redirect("/campaigns");

  // Get templates
  const templates = await prisma.postTemplate.findMany({
    where: { orgId: await getSessionOrg() },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, name: true, content: true, mediaUrls: true },
  });

  return (
    <div className="max-w-2xl w-full">
      <PageHeader
        title="Add Post"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Campaigns", href: "/campaigns" },
          { label: campaign.name, href: `/campaigns/${campaign.id}` },
          { label: "New Post" },
        ]}
      />

      <PostForm
        campaignId={campaign.id}
        platforms={campaign.targetPlatforms}
        templates={templates}
      />
    </div>
  );
}
