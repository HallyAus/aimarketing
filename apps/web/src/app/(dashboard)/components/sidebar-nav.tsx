"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/campaigns", label: "Campaigns", icon: "megaphone" },
  { href: "/analytics", label: "Analytics", icon: "chart" },
  { href: "/calendar", label: "Calendar", icon: "calendar" },
  { href: "/ai", label: "AI Studio", icon: "sparkle" },
  { href: "/templates", label: "Templates", icon: "copy" },
];

const SETTINGS_ITEMS = [
  { href: "/settings/connections", label: "Connections" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/billing", label: "Billing" },
];

function NavIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    grid: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
    megaphone: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    sparkle: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    copy: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  };
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={icons[type] ?? icons.grid} />
    </svg>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export function SidebarNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
          style={{ background: "var(--accent-blue)" }}
        >
          AP
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          AdPilot
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-2" role="navigation" aria-label="Main navigation">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium rounded-lg transition-colors"
                style={{
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  background: active ? "var(--bg-hover)" : "transparent",
                  borderLeft: active ? "3px solid var(--accent-blue)" : "3px solid transparent",
                }}
              >
                <NavIcon type={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Settings section */}
        <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border-secondary)" }}>
          <div className="section-label px-2.5 mb-2">Settings</div>
          <div className="space-y-0.5">
            {SETTINGS_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-2.5 py-1.5 text-[13px] rounded-lg transition-colors"
                  style={{
                    color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                    background: active ? "var(--bg-hover)" : "transparent",
                    borderLeft: active ? "3px solid var(--accent-blue)" : "3px solid transparent",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border-secondary)" }}>
        <div className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
          AdPilot v1.0
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-56 flex-col fixed inset-y-0 left-0 z-30"
        style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-secondary)" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <header
        className="md:hidden fixed top-0 inset-x-0 z-30 px-4 py-3 flex items-center justify-between"
        style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-secondary)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white"
            style={{ background: "var(--accent-blue)" }}
          >
            AP
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            AdPilot
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg"
          style={{ color: "var(--text-secondary)" }}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setMobileOpen(false)}
          style={{ background: "rgba(0, 0, 0, 0.5)" }}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-56 flex flex-col transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border-secondary)" }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
