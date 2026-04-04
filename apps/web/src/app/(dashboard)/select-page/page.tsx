import { prisma } from "@/lib/db";
import { auth, getSessionOrg } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Select Page",
  robots: { index: false },
};

/* ------------------------------------------------------------------ */
/*  Platform metadata                                                  */
/* ------------------------------------------------------------------ */

const PLATFORM_META: Record<string, { color: string; label: string }> = {
  FACEBOOK: { color: "#1877F2", label: "Facebook" },
  INSTAGRAM: { color: "#E4405F", label: "Instagram" },
  LINKEDIN: { color: "#0A66C2", label: "LinkedIn" },
  TWITTER_X: { color: "#1DA1F2", label: "Twitter/X" },
  TIKTOK: { color: "#00F2EA", label: "TikTok" },
  YOUTUBE: { color: "#FF0000", label: "YouTube" },
  GOOGLE_ADS: { color: "#4285F4", label: "Google Ads" },
  PINTEREST: { color: "#BD081C", label: "Pinterest" },
  SNAPCHAT: { color: "#FFFC00", label: "Snapchat" },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function SelectPagePage() {
  const orgId = await getSessionOrg();
  const session = await auth();
  const userId = session?.user?.id;

  const pages = await prisma.page.findMany({
    where: { orgId, isActive: true },
    select: {
      id: true,
      platform: true,
      name: true,
      platformPageId: true,
      avatarUrl: true,
      isActive: true,
    },
    orderBy: [{ platform: "asc" }, { name: "asc" }],
  });

  // Auto-select if only one page exists
  if (pages.length === 1 && pages[0]) {
    const page = pages[0];
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("reachpilot-active-page", JSON.stringify({
      id: page.id,
      platform: page.platform,
      name: page.name,
      type: "page",
    }), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    // Update DB preference
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastSelectedPageId: page.id },
      }).catch(() => {});
    }

    redirect("/dashboard");
  }

  // No pages at all
  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[var(--text-tertiary)]"
            >
              <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
              <path d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            No Pages Connected
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            Connect a Facebook Page, Instagram account, or other platform to get started.
          </p>
          <a
            href="/settings/connections"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            Connect a Page
          </a>
        </div>
      </div>
    );
  }

  // Group pages by platform
  const grouped = pages.reduce<Record<string, typeof pages>>((acc, page) => {
    const key = page.platform;
    if (!acc[key]) acc[key] = [];
    acc[key].push(page);
    return acc;
  }, {});

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Select a Page
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Choose which page you want to manage. You can switch pages at any time from the top bar.
          </p>
        </div>

        <div className="space-y-4">
          {Object.entries(grouped).map(([platform, platformPages]) => {
            const meta = PLATFORM_META[platform] ?? { color: "#888", label: platform };
            return (
              <div key={platform}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    {meta.label}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {platformPages.map((page) => (
                    <a
                      key={page.id}
                      href={`/dashboard?page=${page.id}`}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] hover:border-[var(--accent-blue)] transition-all no-underline group"
                    >
                      {/* Avatar or fallback */}
                      {page.avatarUrl ? (
                        <img
                          src={page.avatarUrl}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{
                            background: `${meta.color}20`,
                            color: meta.color,
                          }}
                        >
                          {page.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Name + platform ID */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {page.name}
                        </div>
                        <div className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>
                          {page.platformPageId}
                        </div>
                      </div>

                      {/* Status + arrow */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: page.isActive
                              ? "var(--accent-emerald, #22c55e)"
                              : "var(--accent-amber, #f59e0b)",
                          }}
                        />
                        <svg
                          className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent-blue)] transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer link */}
        <div className="text-center mt-6">
          <a
            href="/settings/connections"
            className="text-xs text-[var(--accent-blue)] hover:underline"
          >
            Connect another page
          </a>
        </div>
      </div>
    </div>
  );
}
