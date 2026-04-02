import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Add Post</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Campaign: {campaign.name}</p>

      <PostForm
        campaignId={campaign.id}
        platforms={campaign.targetPlatforms}
        templates={templates}
      />
    </div>
  );
}
