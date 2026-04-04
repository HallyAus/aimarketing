import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ActiveAccountBanner } from "@/components/active-account-banner";
import { getActiveAccount } from "@/lib/active-account";
import { getActivePageId, pageWhere } from "@/lib/active-page";
import type { Platform } from "@reachpilot/db";

export const metadata: Metadata = {
  title: "Post Templates",
  robots: { index: false },
};

export default async function TemplatesPage() {
  const activeAccount = await getActiveAccount();
  const orgId = await getSessionOrg();
  const activePageId = await getActivePageId(orgId);

  // Filter templates by platform when a specific account is selected
  const platformFilter = activeAccount ? { platform: activeAccount.platform as Platform } : {};

  const templates = await prisma.postTemplate.findMany({
    where: { orgId, ...platformFilter },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Post Templates"
        subtitle={activeAccount ? `Save and reuse your best-performing post formats — ${activeAccount.name}` : "Save and reuse your best-performing post formats"}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Templates" },
        ]}
        action={
          <Link href="/templates/new" className="btn-primary text-sm">
            New Template
          </Link>
        }
      />
      <ActiveAccountBanner account={activeAccount} />

      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet."
          description="Create reusable post templates to speed up content creation."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="card card-hover">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>{t.name}</h3>
                {t.platform && (
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{t.platform}</span>
                )}
              </div>
              <p className="text-sm line-clamp-3" style={{ color: "var(--text-secondary)" }}>{t.content}</p>
              {t.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {tag}
                    </span>
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
