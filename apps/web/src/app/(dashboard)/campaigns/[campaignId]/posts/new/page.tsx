import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";
import { SubmitButton } from "@/components/submit-button";

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
  });

  async function createPost(formData: FormData) {
    "use server";
    // auth disabled
    // auth disabled

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/campaigns/${campaignId}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: formData.get("platform"),
        content: formData.get("content"),
        scheduledAt: formData.get("scheduledAt") || undefined,
      }),
    });

    redirect(`/campaigns/${campaignId}`);
  }

  return (
    <div className="max-w-2xl w-full">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Add Post</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Campaign: {campaign.name}</p>

      {templates.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Start from template (optional)
          </label>
          <div className="flex gap-2 flex-wrap">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                className="text-xs px-3 py-1 rounded card-hover"
                style={{
                  border: "1px solid var(--border-primary)",
                  color: "var(--text-secondary)",
                  background: "var(--bg-secondary)",
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form action={createPost} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Platform</label>
          <select name="platform" required className="w-full rounded-md px-3 py-2 text-sm">
            {campaign.targetPlatforms.map((p) => (
              <option key={p} value={p}>{p.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Content</label>
          <textarea
            name="content"
            required
            rows={6}
            className="w-full rounded-md px-3 py-2 text-sm"
            placeholder="Write your post content..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Schedule (optional)</label>
          <input name="scheduledAt" type="datetime-local" className="w-full rounded-md px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-3">
          <SubmitButton loadingText="Creating...">
            Create Post
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
