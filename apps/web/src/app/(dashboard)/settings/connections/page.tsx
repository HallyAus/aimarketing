import { getOrgId } from "@/lib/get-org";
import { redirect } from "next/navigation";
import { prisma } from "@adpilot/db";
import { PLATFORM_CONFIGS } from "@adpilot/platform-sdk";
import type { Platform } from "@adpilot/platform-sdk";

const PLATFORM_ORDER: Platform[] = [
  "FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X",
  "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT",
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-yellow-100 text-yellow-800",
  REVOKED: "bg-red-100 text-red-800",
};

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  
  if (false) {
    redirect("/org-picker");
  }

  const params = await searchParams;
  const orgId = await getOrgId();

  const connections = await prisma.platformConnection.findMany({
    where: { orgId },
  });

  const connectionMap = new Map(
    connections.map((c) => [c.platform, c])
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Platform Connections</h1>
      <p className="text-gray-500 mb-6">
        Connect your social media accounts to manage campaigns.
      </p>

      {params.success === "connected" && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          Platform connected successfully!
        </div>
      )}

      {params.error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          Connection failed: {params.error.replace(/_/g, " ")}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORM_ORDER.map((platform) => {
          const config = PLATFORM_CONFIGS[platform];
          const connection = connectionMap.get(platform);

          return (
            <div
              key={platform}
              className="border rounded-lg p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{config.displayName}</h3>
                  {connection && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[connection.status]}`}
                    >
                      {connection.status}
                    </span>
                  )}
                </div>
                {connection && (
                  <p className="text-sm text-gray-500">
                    {connection.platformAccountName ?? connection.platformUserId}
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {!connection ? (
                  <a
                    href={`/api/platforms/${platform}/authorize`}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Connect
                  </a>
                ) : connection.status === "EXPIRED" ? (
                  <a
                    href={`/api/platforms/${platform}/authorize`}
                    className="inline-flex items-center rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-700"
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
                      redir("/dashboard/settings/connections");
                    }}
                  >
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Disconnect
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
