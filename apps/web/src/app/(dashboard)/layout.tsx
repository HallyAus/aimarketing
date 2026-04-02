import { SidebarNav } from "./components/sidebar-nav";
import { TopBar } from "./components/top-bar";
import { LayoutShell } from "./components/layout-shell";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium bg-[var(--accent-blue)] text-white"
      >
        Skip to content
      </a>

      <SidebarNav />

      {/* Right side: top bar + content */}
      <LayoutShell>
        <TopBar />

        {/* Main content */}
        <main id="main-content" className="flex-1">
          <div className="pt-16 md:pt-4 px-4 md:px-8 py-3 md:py-5 max-w-full xl:max-w-7xl">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-4 md:px-8 py-4 text-[11px] text-[var(--text-tertiary)] border-t border-[var(--border-secondary)]">
          <div className="max-w-full xl:max-w-7xl flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>AdPilot &copy; 2026</span>
            <span className="text-[var(--border-primary)]">&middot;</span>
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">Help</a>
            <span className="text-[var(--border-primary)]">&middot;</span>
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">Docs</a>
            <span className="text-[var(--border-primary)]">&middot;</span>
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">Privacy</a>
            <span className="text-[var(--border-primary)]">&middot;</span>
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">Terms</a>
          </div>
        </footer>
      </LayoutShell>
    </div>
  );
}
