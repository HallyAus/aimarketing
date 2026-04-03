"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { AccountSelector } from "./account-selector";

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
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  rss: "M4 11a9 9 0 019 9M4 4a16 16 0 0116 16M5 20a1 1 0 100-2 1 1 0 000 2z",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  globe: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  layout: "M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm0 9h16M9 12v9",
  "contact-book": "M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm-7 5a2 2 0 100 4 2 2 0 000-4zm4 8H8v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1z",
  "clip-report": "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6 4h6m-6-8h2",
  translate: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129",
  clock: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 0v10l4 2",
  smile: "M12 2a10 10 0 100 20 10 10 0 000-20zm-3 9h.01M15 11h.01M8 15s1.5 2 4 2 4-2 4-2",
  target: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 100 12 6 6 0 000-12zm0 4a2 2 0 100 4 2 2 0 000-4z",
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  "trending-up": "M23 6l-9.5 9.5-5-5L1 18",
  "message-circle": "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
};

function NavIcon({ type, className }: { type: string; className?: string }) {
  return (
    <svg
      className={className ?? "w-5 h-5 flex-shrink-0"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
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
  description: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "grid", description: "Your command centre — metrics, upcoming posts, quick actions" }],
  },
  {
    title: "CONTENT",
    items: [
      { href: "/campaigns", label: "Campaigns", icon: "megaphone", description: "Create and manage marketing campaigns across platforms" },
      { href: "/calendar", label: "Calendar", icon: "calendar", description: "Visual calendar of all scheduled and published posts" },
      { href: "/drafts", label: "Drafts", icon: "file-text", description: "AI-generated posts saved for review before scheduling" },
      { href: "/templates", label: "Templates", icon: "copy", description: "Reusable post templates for consistent content" },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { href: "/ai", label: "AI Studio", icon: "sparkles", description: "Generate posts, improve content, create images with AI" },
      { href: "/ai/brand-voice", label: "Brand Voice", icon: "megaphone", description: "Train AI to write in your brand's unique tone and style" },
      { href: "/ai/competitor-match", label: "Competitor Match", icon: "target", description: "Create your version of a competitor's post targeting the same audience" },
      { href: "/ai/keyword-scanner", label: "Keyword Scanner", icon: "globe", description: "Compare your website keywords vs competitors — find gaps" },
      { href: "/ai/competitor-spy", label: "Competitor Spy", icon: "users", description: "Analyze competitor strategies and content patterns" },
      { href: "/ai/hashtags", label: "Hashtag Research", icon: "link", description: "Find trending and niche hashtags for any topic" },
      { href: "/ai/image-gen", label: "Image Generator", icon: "grid", description: "Create social media images from text descriptions" },
      { href: "/ai/video-scripts", label: "Video Scripts", icon: "file-text", description: "Generate scripts for TikTok, Reels, Shorts, YouTube" },
      { href: "/ai/bulk-generate", label: "Bulk Generate", icon: "copy", description: "Create a week or month of content in one go" },
      { href: "/ai/repurpose", label: "Repurpose", icon: "sparkles", description: "Transform existing content into new formats for different platforms" },
      { href: "/ai/ab-test", label: "A/B Variants", icon: "copy", description: "Generate multiple versions of a post to test what works best" },
      { href: "/ai/carousel", label: "Carousel Builder", icon: "file-text", description: "Create multi-slide carousel posts for Instagram and LinkedIn" },
      { href: "/ai/templates-ai", label: "Story Templates", icon: "sparkles", description: "AI-generated story templates for Instagram and Facebook" },
      { href: "/ai/trending", label: "Trending Topics", icon: "trending-up", description: "Discover what's trending in your industry right now" },
      { href: "/ai/translate", label: "Translate", icon: "translate", description: "Translate your posts into multiple languages with AI" },
      { href: "/analytics", label: "Analytics", icon: "bar-chart", description: "Track post performance, engagement, and growth" },
      { href: "/analytics/benchmarking", label: "Benchmarking", icon: "target", description: "Compare your metrics against competitors" },
      { href: "/analytics/best-times", label: "Best Times", icon: "clock", description: "AI-predicted optimal posting times for your audience" },
      { href: "/analytics/sentiment", label: "Sentiment", icon: "smile", description: "Analyze the emotional tone of your content" },
      { href: "/analytics/audience", label: "Audience", icon: "users", description: "Understand your followers — demographics, interests, active hours" },
      { href: "/analytics/roi", label: "ROI Calculator", icon: "dollar", description: "Calculate return on your marketing investment" },
    ],
  },
  {
    title: "LEADS & CRM",
    items: [
      { href: "/community", label: "Community Feed", icon: "users", description: "Discover niche content and get AI engagement suggestions" },
      { href: "/leads", label: "Lead Capture", icon: "inbox", description: "Collect and manage leads from forms and social" },
      { href: "/approvals", label: "Approvals", icon: "check", description: "Review and approve posts before they go live" },
      { href: "/settings/crm", label: "CRM", icon: "contact-book", description: "Connect your CRM to sync leads automatically" },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { href: "/tools/utm", label: "UTM Builder", icon: "link", description: "Create tracked links for every campaign" },
      { href: "/tools/landing-page", label: "Landing Pages", icon: "layout", description: "AI-generated landing pages for campaigns" },
      { href: "/email", label: "Email Marketing", icon: "mail", description: "Create and send email campaigns with AI" },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      { href: "/settings/business-profile", label: "Business Profile", icon: "globe", description: "Your website, industry, competitors — used by AI tools" },
      { href: "/settings/connections", label: "Connections", icon: "link", description: "Connect your social media accounts" },
      { href: "/settings/rss", label: "RSS Feeds", icon: "rss", description: "Auto-generate posts from blog RSS feeds" },
      { href: "/settings/webhooks", label: "Webhooks", icon: "zap", description: "Automated triggers — when X happens, do Y" },
      { href: "/settings/reports", label: "Reports", icon: "clip-report", description: "Schedule weekly performance reports via email" },
      { href: "/settings/auto-reply", label: "Auto-Reply", icon: "message-circle", description: "AI-powered automatic responses to messages" },
      { href: "/settings/team", label: "Team", icon: "users", description: "Manage team members and permissions" },
      { href: "/settings/billing", label: "Billing", icon: "credit-card", description: "Subscription plan and payment settings" },
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

function Tooltip({ label, description, show }: { label: string; description: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none">
      <div className="px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-primary)] shadow-lg">
        <div>{label}</div>
        <div className="font-normal text-[10px] text-[var(--text-tertiary)] mt-0.5 max-w-[220px] whitespace-normal">{description}</div>
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
    } catch { /* non-critical */ }
    setMounted(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
        window.dispatchEvent(new Event("sidebar-toggle"));
      } catch { /* non-critical */ }
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
        title={item.description}
        onClick={closeMobile ? () => setMobileOpen(false) : undefined}
        onMouseEnter={() => setHoveredItem(item.href)}
        onMouseLeave={() => setHoveredItem(null)}
        aria-current={active ? "page" : undefined}
        aria-label={collapsed ? item.label : undefined}
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
          <Tooltip label={item.label} description={item.description} show={hoveredItem === item.href} />
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

      {/* Get Started link for new users (before nav sections) */}
      {mounted && (() => {
        try { if (localStorage.getItem("adpilot-onboarding-complete")) return null; } catch { return null; }
        return (
          <div className="px-3 mb-1">
            <Link
              href="/onboarding"
              onClick={isMobile ? () => setMobileOpen(false) : undefined}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150
                text-white font-medium text-[13px] no-underline
                ${collapsed && !isMobile ? "justify-center px-0 py-2.5 mx-auto w-10 h-10" : ""}
              `}
              style={{ background: "var(--accent-blue)" }}
            >
              <NavIcon type="zap" />
              {(!collapsed || isMobile) && <span>Get Started</span>}
            </Link>
          </div>
        );
      })()}

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
        <div className="flex items-center gap-2">
          <AccountSelector />
          <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 rounded-lg text-[var(--text-secondary)] min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
        </div>
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
        id="mobile-sidebar"
        aria-label="Main navigation"
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
