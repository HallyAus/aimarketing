import { SidebarNav } from "./components/sidebar-nav";
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
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        style={{ background: "var(--accent-blue)", color: "white" }}
      >
        Skip to content
      </a>

      <SidebarNav />

      {/* Main content */}
      <main id="main-content" className="flex-1 md:ml-56 min-h-screen">
        <div className="pt-14 md:pt-0 px-4 md:px-8 py-6 md:py-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
