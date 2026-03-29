import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";

const OBJECTIVES = ["AWARENESS", "TRAFFIC", "ENGAGEMENT", "CONVERSIONS", "LEADS"];
const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"];

export default async function NewCampaignPage() {
  const session = await auth();
  if (!session?.user?.currentOrgId) redirect("/org-picker");

  // Get connected platforms
  const connections = await prisma.platformConnection.findMany({
    where: { orgId: session.user.currentOrgId, status: "ACTIVE" },
    select: { platform: true },
  });
  const connectedPlatforms = new Set(connections.map((c) => c.platform));

  async function createCampaign(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.currentOrgId) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: "" },
      body: JSON.stringify({
        name: formData.get("name"),
        objective: formData.get("objective"),
        targetPlatforms: formData.getAll("platforms"),
        budget: formData.get("budget") ? Number(formData.get("budget")) : undefined,
        startDate: formData.get("startDate") || undefined,
        endDate: formData.get("endDate") || undefined,
      }),
    });

    if (res.ok) {
      const campaign = await res.json();
      redirect(`/campaigns/${campaign.id}`);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create Campaign</h1>
      <form action={createCampaign} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Campaign Name</label>
          <input name="name" required className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Summer Sale 2026" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Objective</label>
          <select name="objective" required className="w-full rounded-md border px-3 py-2 text-sm">
            {OBJECTIVES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Target Platforms</label>
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS.map((p) => (
              <label key={p} className={`flex items-center gap-2 text-sm p-2 rounded border ${connectedPlatforms.has(p) ? "" : "opacity-40"}`}>
                <input type="checkbox" name="platforms" value={p} disabled={!connectedPlatforms.has(p)} />
                {p.replace("_", " ")}
              </label>
            ))}
          </div>
          {connectedPlatforms.size === 0 && (
            <p className="text-sm text-red-500 mt-1">No platforms connected. Connect platforms first.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Budget (optional)</label>
            <input name="budget" type="number" step="0.01" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <input name="currency" defaultValue="USD" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input name="startDate" type="datetime-local" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input name="endDate" type="datetime-local" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
        </div>

        <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Create Campaign
        </button>
      </form>
    </div>
  );
}
