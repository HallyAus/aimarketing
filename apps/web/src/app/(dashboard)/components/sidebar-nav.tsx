"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Icon paths (20x20 viewBox, stroke-based)                           */
/* ------------------------------------------------------------------ */

const ICONS: Record<string, string> = {
  grid: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
  megaphone:
    "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
  calendar:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  "file-text":
    "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8m8 4H8m2-8H8",
  copy: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  sparkles:
    "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  "bar-chart":
    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
  users:
    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  "credit-card":
    "M1 10h22M3 4h18a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2z",
  "chevrons-left":
    "M11 17l-5-5 5-5M18 17l-5-5 5-5",
  "chevrons-right":
    "M13 17l5-5-5-5M6 17l5-5-5-5",
};

function NavIcon({ type, className }: { type: string; className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5 flex-shrink-0"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={ICONS[type] ?? ICONS.grid}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Navigation structure                                               */
/* ------------------------------------------------------------------ */

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "grid" }],
  },
  {
    title: "CONTENT",
    items: [
      { href: "/campaigns", label: "Campaigns", icon: "megaphone" },
      { href: "/calendar", label: "Calendar", icon: "calendar" },
      { href: "/drafts", label: "Drafts", icon: "file-text" },
      { href: "/templates", label: "Templates", icon: "copy" },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { href: "/ai", label: "AI Studio", icon: "sparkles" },
      { href: "/ai/bulk-generate", label: "Bulk Generate", icon: "copy" },
      { href: "/analytics", label: "Analytics", icon: "bar-chart" },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { href: "/settings/connections", label: "Connections", icon: "link" },
      { href: "/settings/team", label: "Team", icon: "users" },
      { href: "/settings/billing", label: "Billing", icon: "credit-card" },
    ],
  },
];

const STORAGE_KEY = "adpilot-sidebar-collapsed";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

/* ------------------------------------------------------------------ */
/*  Tooltip (shown in collapsed mode)                                  */
/* ------------------------------------------------------------------ */

function Tooltip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none">
      <div className="px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-primary)] shadow-lg">
        {label}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar component                                                  */
/* ------------------------------------------------------------------ */

export function SidebarNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {}
    setMounted(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
        window.dispatchEvent(new Event("sidebar-toggle"));
      } catch {}
      return next;
    });
  }, []);

  // Sidebar width
  const sidebarWidth = collapsed ? "w-16" : "w-60";

  const renderNavItem = (item: NavItem, closeMobile?: boolean) => {
    const active = isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={closeMobile ? () => setMobileOpen(false) : undefined}
        onMouseEnter={() => setHoveredItem(item.href)}
        onMouseLeave={() => setHoveredItem(null)}
        className={`
          relative flex items-center gap-3 rounded-lg transition-all duration-150
          ${collapsed ? "justify-center px-0 py-2.5 mx-auto w-10 h-10" : "px-3 py-2"}
          ${active
            ? "text-[var(--text-primary)] bg-[var(--accent-blue-muted)] border-l-[3px] border-l-[var(--accent-blue)]"
            : "text-[var(--text-secondary)] border-l-[3px] border-l-transparent hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          }
        `}
      >
        <NavIcon type={item.icon} />
        {!collapsed && (
          <span className="text-[13px] font-medium truncate">{item.label}</span>
        )}
        {collapsed && (
          <Tooltip label={item.label} show={hoveredItem === item.href} />
        )}
      </Link>
    );
  };

  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo */}
      <div className={`flex items-center ${collapsed && !isMobile ? "justify-center px-2 py-5" : "px-5 py-5 gap-2.5"}`}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white bg-[var(--accent-blue)] flex-shrink-0">
          AP
        </div>
        {(!collapsed || isMobile) && (
          <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
            AdPilot
          </span>
        )}
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={section.title} className={sIdx > 0 ? "mt-6" : ""}>
            {(!collapsed || isMobile) && (
              <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                {section.title}
              </div>
            )}
            {collapsed && !isMobile && sIdx > 0 && (
              <div className="mx-3 mb-2 border-t border-[var(--border-secondary)]" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => renderNavItem(item, isMobile))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div className="px-3 py-3 border-t border-[var(--border-secondary)]">
          <button
            type="button"
            onClick={toggleCollapsed}
            className={`
              flex items-center gap-2 rounded-lg transition-colors w-full
              text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]
              ${collapsed ? "justify-center p-2" : "px-3 py-2"}
            `}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <NavIcon type={collapsed ? "chevrons-right" : "chevrons-left"} className="w-4 h-4" />
            {!collapsed && (
              <span className="text-xs font-medium">Collapse</span>
            )}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col fixed inset-y-0 left-0 z-30
          bg-[var(--bg-secondary)] border-r border-[var(--border-secondary)]
          transition-[width] duration-200 ease-in-out
          ${mounted ? sidebarWidth : "w-60"}
        `}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 px-4 py-3 flex items-center justify-between bg-[var(--bg-secondary)] border-b border-[var(--border-secondary)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black text-white bg-[var(--accent-blue)]">
            AP
          </div>
          <span className="text-sm font-bold text-[var(--text-primary)]">
            AdPilot
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-[var(--text-secondary)]"
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
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`
          md:hidden fixed inset-y-0 left-0 z-50 w-60 flex flex-col
          bg-[var(--bg-secondary)] border-r border-[var(--border-secondary)]
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent(true)}
      </aside>
    </>
  );
}
