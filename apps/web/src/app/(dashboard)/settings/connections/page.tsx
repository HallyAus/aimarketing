import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PLATFORM_CONFIGS } from "@adpilot/platform-sdk";
import type { Platform } from "@adpilot/platform-sdk";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { FacebookPages } from "./facebook-pages";

export const metadata: Metadata = {
  title: "Platform Connections",
  robots: { index: false },
};

const PLATFORM_ORDER: Platform[] = [
  "FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X",
  "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT",
];

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const orgId = await getSessionOrg();

  const connections = await prisma.platformConnection.findMany({
    where: { orgId },
  });

  const connectionMap = new Map(
    connections.map((c) => [c.platform, c])
  );

  return (
    <div>
      <PageHeader
        title="Platform Connections"
        subtitle="Connect your social media accounts to manage campaigns."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Settings", href: "/settings/connections" },
          { label: "Connections" },
        ]}
      />

      {params.success === "connected" && (
        <div className="alert alert-success mb-4">
          Platform connected successfully!
        </div>
      )}

      {params.error && (
        <div className="alert alert-error mb-4">
          Connection failed: {params.error.replace(/_/g, " ")}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORM_ORDER.map((platform) => {
          const config = PLATFORM_CONFIGS[platform];
          const connection = connectionMap.get(platform);

          // Extract saved Facebook page IDs from connection metadata
          const fbSavedPageIds: string[] =
            platform === "FACEBOOK" && connection?.status === "ACTIVE" && connection.metadata
              ? ((connection.metadata as Record<string, unknown>)?.selectedPages as Array<{ id: string }> ?? []).map((p) => p.id)
              : [];

          return (
            <div
              key={platform}
              className="card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>{config.displayName}</h3>
                  {connection && (
                    <StatusBadge status={connection.status} />
                  )}
                </div>
                {connection && (
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {connection.platformAccountName ?? connection.platformUserId}
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {!connection ? (
                  <a
                    href={`/api/platforms/${platform}/authorize`}
                    className="btn-primary text-sm inline-flex items-center"
                  >
                    Connect
                  </a>
                ) : connection.status === "EXPIRED" ? (
                  <a
                    href={`/api/platforms/${platform}/authorize`}
                    className="btn-primary text-sm"
                    style={{ background: "var(--accent-amber)", color: "var(--text-inverse)" }}
                  >
                    Reconnect
                  </a>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await fetch(
                        `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/${platform}/disconnect`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ connectionId: connection.id }),
                        }
                      );
                      const { redirect: redir } = await import("next/navigation");
                      redir("/settings/connections");
                    }}
                  >
                    <button
                      type="submit"
                      className="btn-danger text-sm inline-flex items-center"
                    >
                      Disconnect
                    </button>
                  </form>
                )}
              </div>

              {/* Facebook Page Picker — shown when Facebook is actively connected */}
              {platform === "FACEBOOK" && connection?.status === "ACTIVE" && (
                <FacebookPages savedPageIds={fbSavedPageIds} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
