"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AccountSelector } from "./account-selector";
import { PageSwitcher } from "@/components/page-switcher";
import { TimezoneSelector } from "./timezone-selector";

export function TopBar() {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [publishingPaused, setPublishingPaused] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch initial publishing state from the dedicated endpoint
  useEffect(() => {
    fetch("/api/organizations/pause-publishing")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.paused === "boolean") {
          setPublishingPaused(data.paused);
        }
      })
      .catch(() => {});
  }, []);

  const togglePause = useCallback(async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await fetch("/api/organizations/pause-publishing", {
        method: "POST",
      });
      const data = await res.json();
      if (typeof data.paused === "boolean") {
        setPublishingPaused(data.paused);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setToggling(false);
    }
  }, [toggling]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [userMenuOpen]);

  return (
    <div className="hidden md:flex items-center justify-between h-14 px-6 border-b border-[var(--border-secondary)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm flex-shrink-0">
      {/* Left: placeholder for breadcrumb context */}
      <div className="text-xs text-[var(--text-tertiary)]">
        {/* Breadcrumbs are rendered per-page inside PageHeader */}
      </div>

      {/* Right: publishing toggle + search + notification + user */}
      <div className="flex items-center gap-3">
        {/* Publishing pause toggle */}
        {publishingPaused !== null && (
          <button
            type="button"
            onClick={togglePause}
            disabled={toggling}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
            style={{
              background: publishingPaused
                ? "var(--accent-red-muted, rgba(239,68,68,0.1))"
                : "var(--accent-green-muted, rgba(34,197,94,0.1))",
              borderColor: publishingPaused
                ? "var(--accent-red, #ef4444)"
                : "var(--accent-green, #22c55e)",
              color: publishingPaused
                ? "var(--accent-red, #ef4444)"
                : "var(--accent-green, #22c55e)",
              opacity: toggling ? 0.6 : 1,
            }}
            aria-label={publishingPaused ? "Resume publishing" : "Pause publishing"}
          >
            {publishingPaused ? (
              <>
                <span
                  className="relative flex h-2 w-2"
                  aria-hidden="true"
                >
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: "var(--accent-red, #ef4444)" }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ background: "var(--accent-red, #ef4444)" }}
                  />
                </span>
                <span>Publishing Paused</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Publishing Active</span>
              </>
            )}
          </button>
        )}

        {/* Search placeholder */}
        <button
          type="button"
          disabled
          aria-label="Search (coming soon)"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] cursor-not-allowed opacity-60 min-h-[36px]"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden lg:inline">Search...</span>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-primary)] text-[var(--text-tertiary)] border border-[var(--border-primary)]">
            <span className="text-[9px]">&#8984;</span>K
          </kbd>
        </button>

        {/* Page switcher (primary) */}
        <PageSwitcher />

        {/* Legacy account selector (hidden, kept for backwards compat) */}
        <div className="hidden">
          <AccountSelector />
        </div>

        {/* Notification bell */}
        <button
          type="button"
          className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Notifications"
        >
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>

        {/* User avatar + dropdown */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold bg-[var(--accent-blue-muted)] text-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:text-white transition-colors"
            aria-label="User menu"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-primary)] shadow-xl py-1 z-50" role="menu" aria-label="User menu">
              <div className="px-3 py-2.5 border-b border-[var(--border-secondary)]">
                <div className="text-sm font-medium text-[var(--text-primary)]">{session?.user?.name ?? "User"}</div>
                <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{session?.user?.email ?? ""}</div>
                {session?.user?.currentRole && (
                  <div className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase tracking-wider font-medium">{session.user.currentRole}</div>
                )}
              </div>
              {/* Admin link — only for ADMIN/SUPER_ADMIN */}
              {(session?.user as Record<string, unknown>)?.systemRole === "ADMIN" || (session?.user as Record<string, unknown>)?.systemRole === "SUPER_ADMIN" ? (
                <Link
                  href="/admin"
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-purple)] hover:bg-[var(--bg-hover)] transition-colors min-h-[44px]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Dashboard
                </Link>
              ) : null}
              {/* Timezone selector */}
              <div className="border-b border-[var(--border-secondary)]">
                <TimezoneSelector />
              </div>
              <a
                href="/api/auth/signout"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign Out
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
