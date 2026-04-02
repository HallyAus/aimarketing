import { getSessionOrg } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { CampaignForm } from "./campaign-form";

export default async function NewCampaignPage() {
  const orgId = await getSessionOrg();

  const connections = await prisma.platformConnection.findMany({
    where: { orgId, status: "ACTIVE" },
    select: { platform: true },
  });
  const connectedPlatforms = new Set<string>(connections.map((c) => c.platform));

  return (
    <div className="max-w-2xl w-full">
      <PageHeader
        title="Create Campaign"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Campaigns", href: "/campaigns" },
          { label: "New Campaign" },
        ]}
      />
      <CampaignForm connectedPlatforms={connectedPlatforms} />
    </div>
  );
}
