import { DemoSidebarNav } from "./components/demo-sidebar-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AdPilot Demo — See What's Possible",
  description:
    "Explore the AdPilot marketing platform with realistic demo data. No sign-up required.",
  robots: { index: true, follow: true },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Demo banner — top bar */}
      <div
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 md:px-6 py-2"
        style={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
          color: "white",
          fontSize: "0.8125rem",
          fontWeight: 500,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            Demo Mode
          </span>
          <span className="hidden sm:inline">
            You&apos;re viewing a demo &mdash; Book a call to see the real thing
          </span>
          <span className="sm:hidden">Demo &mdash; not real data</span>
        </div>
        <a
          href="/signin"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all"
          style={{
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(4px)",
            color: "white",
          }}
        >
          Book a Strategy Call
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        style={{ background: "var(--accent-blue)", color: "white" }}
      >
        Skip to content
      </a>

      <DemoSidebarNav />

      {/* Main content */}
      <main id="main-content" className="flex-1 md:ml-56 min-h-screen">
        {/* offset for demo banner (32px) + mobile header (56px) */}
        <div className="pt-[88px] md:pt-10 px-4 md:px-8 py-6 md:py-8 max-w-6xl">
          {children}
        </div>
      </main>

      {/* Floating CTA — bottom right */}
      <a
        href="/signin"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold shadow-lg transition-transform hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
          color: "white",
          boxShadow: "0 4px 24px rgba(59, 130, 246, 0.4)",
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
        Get Started Free
      </a>
    </div>
  );
}
