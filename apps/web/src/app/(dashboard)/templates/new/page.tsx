import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"];

export default async function NewTemplatePage() {
  const session = await auth();
  if (!session?.user?.currentOrgId) redirect("/org-picker");

  async function createTemplate(formData: FormData) {
    "use server";
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        platform: formData.get("platform") || undefined,
        content: formData.get("content"),
        tags: formData.get("tags") ? (formData.get("tags") as string).split(",").map((t) => t.trim()).filter(Boolean) : [],
      }),
    });
    redirect("/templates");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create Template</h1>
      <form action={createTemplate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Template Name</label>
          <input name="name" required className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Product Launch Announcement" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Platform (optional — leave blank for universal)</label>
          <select name="platform" className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="">Any Platform</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea name="content" required rows={6} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Write your template content..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
          <input name="tags" className="w-full rounded-md border px-3 py-2 text-sm" placeholder="promo, launch, product" />
        </div>
        <button type="submit" className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Create Template
        </button>
      </form>
    </div>
  );
}
