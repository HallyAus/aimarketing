import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { SidebarNav } from "./components/sidebar-nav";
import { TopBar } from "./components/top-bar";
import { LayoutShell } from "./components/layout-shell";
import { PageProvider, type PageInfo } from "@/lib/page-context";
import { TimezoneDetector } from "@/components/timezone-detector";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/* ------------------------------------------------------------------ */
/*  Resolve active page from cookie / DB                               */
/* ------------------------------------------------------------------ */

async function resolveActivePageId(
  userId: string | undefined,
  orgId: string | undefined,
): Promise<string | null> {
  // 1. Try cookie
  const cookieStore = await cookies();
  const raw = cookieStore.get("adpilot-active-page")?.value;
  if (raw && raw !== "all") {
    try {
      const decoded = decodeURIComponent(raw);
      const parsed = JSON.parse(decoded);
      if (parsed?.id) return parsed.id as string;
    } catch {
      // Invalid cookie — fall through
    }
  }

  // 2. Try DB lastSelectedPageId (wrapped in try-catch for pre-migration resilience)
  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lastSelectedPageId: true },
      });
      if (user?.lastSelectedPageId) return user.lastSelectedPageId;
    } catch {
      // Field may not exist in DB yet if migration hasn't run
    }
  }

  // 3. Auto-select first page in org
  if (orgId) {
    const firstPage = await prisma.page.findFirst({
      where: { orgId, isActive: true },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (firstPage) return firstPage.id;
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const orgId = session?.user?.currentOrgId;

  // Fetch all pages for the org (try-catch for pre-migration resilience)
  let allPages: PageInfo[] = [];
  if (orgId) {
    try {
      const rows = await prisma.page.findMany({
        where: { orgId, isActive: true },
        select: {
          id: true,
          platform: true,
          name: true,
          platformPageId: true,
          isActive: true,
        },
        orderBy: [{ platform: "asc" }, { name: "asc" }],
      });
      allPages = rows.map((r) => ({
        id: r.id,
        platform: r.platform,
        name: r.name,
        platformPageId: r.platformPageId,
        avatarUrl: null,
        isActive: r.isActive,
      }));
    } catch {
      // Fields may not exist yet if migration hasn't run
    }
  }

  const activePageId = await resolveActivePageId(userId, orgId);

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium bg-[var(--accent-blue)] text-white"
      >
        Skip to content
      </a>

      <TimezoneDetector />
      <SidebarNav />

      {/* Right side: top bar + content */}
      <LayoutShell>
        <PageProvider initialPageId={activePageId} initialPages={allPages}>
          <TopBar />

          {/* Main content */}
          <main id="main-content" className="flex-1 w-full">
            <div className="pt-[4.5rem] md:pt-4 px-4 md:px-6 lg:px-8 py-3 md:py-5 w-full overflow-x-hidden">
              {children}
            </div>
          </main>
        </PageProvider>

        {/* Footer */}
        <footer className="px-4 md:px-8 py-4 text-[11px] text-[var(--text-tertiary)] border-t border-[var(--border-secondary)]">
          <div className="w-full flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>AdPilot &copy; 2026</span>
            <span className="text-[var(--border-primary)]">&middot;</span>
            <a href="/onboarding" className="hover:text-[var(--text-secondary)] transition-colors">Help</a>
            <span className="text-[var(--border-primary)]">&middot;</span>
            <a href="/docs" className="hover:text-[var(--text-secondary)] transition-colors">Docs</a>
            <span className="text-[var(--border-primary)]">&middot;</span>
            <a href="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">Privacy</a>
            <span className="text-[var(--border-primary)]">&middot;</span>
            <a href="/terms" className="hover:text-[var(--text-secondary)] transition-colors">Terms</a>
          </div>
        </footer>
      </LayoutShell>
    </div>
  );
}
