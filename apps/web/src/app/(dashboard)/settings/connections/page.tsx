import { getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PLATFORM_CONFIGS } from "@adpilot/platform-sdk";
import type { Platform } from "@adpilot/platform-sdk";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { FacebookPages } from "./facebook-pages";
import { BackfillPagesButton } from "./backfill-pages-button";
import { GbpConnect } from "./gbp-connect";

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
        subtitle="Connect your Facebook, Instagram, LinkedIn, and Twitter accounts"
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

      {/* Backfill tool for posts missing page assignments */}
      <div className="mb-6 p-4 rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)]/50">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Page Assignment Backfill</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              Assign page IDs to existing posts that are missing them. Works when a platform has exactly one page selected.
            </p>
          </div>
          <BackfillPagesButton />
        </div>
      </div>

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
                  <h2 className="font-medium text-base" style={{ color: "var(--text-primary)" }}>{config.displayName}</h2>
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

      {/* Google Business Profile */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Additional Platforms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GbpConnect />
        </div>
      </div>
    </div>
  );
}
