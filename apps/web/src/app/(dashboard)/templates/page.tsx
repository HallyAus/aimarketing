import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";
import Link from "next/link";

export default async function TemplatesPage() {
  
  

  const templates = await prisma.postTemplate.findMany({
    where: { orgId: await getOrgId() },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Post Templates</h1>
        <Link
          href="/templates/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <p className="text-gray-500">No templates yet. Create reusable post templates to speed up content creation.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{t.name}</h3>
                {t.platform && <span className="text-xs text-gray-400">{t.platform}</span>}
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">{t.content}</p>
              {t.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {t.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
