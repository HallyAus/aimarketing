"use client";

import { useState, useRef, useEffect } from "react";

export function TopBar() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

      {/* Right: search + notification + user */}
      <div className="flex items-center gap-3">
        {/* Search placeholder */}
        <button
          type="button"
          disabled
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] cursor-not-allowed opacity-60"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden lg:inline">Search...</span>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-primary)] text-[var(--text-tertiary)] border border-[var(--border-primary)]">
            <span className="text-[9px]">&#8984;</span>K
          </kbd>
        </button>

        {/* Notification bell */}
        <button
          type="button"
          className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors relative"
          aria-label="Notifications"
        >
          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>

        {/* User avatar + dropdown */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-[var(--accent-blue-muted)] text-[var(--accent-blue)] hover:bg-[var(--accent-blue)] hover:text-white transition-colors"
            aria-label="User menu"
            aria-expanded={userMenuOpen}
          >
            U
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-primary)] shadow-xl py-1 z-50">
              <div className="px-3 py-2.5 border-b border-[var(--border-secondary)]">
                <div className="text-sm font-medium text-[var(--text-primary)]">User</div>
                <div className="text-xs text-[var(--text-tertiary)] mt-0.5">user@example.com</div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase tracking-wider font-medium">Organization</div>
              </div>
              <a
                href="/api/auth/signout"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
