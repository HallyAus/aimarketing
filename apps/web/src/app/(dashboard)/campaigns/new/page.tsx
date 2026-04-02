import { getSessionOrg } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--text-primary)" }}
      >
        Create Campaign
      </h1>
      <CampaignForm connectedPlatforms={connectedPlatforms} />
    </div>
  );
}
