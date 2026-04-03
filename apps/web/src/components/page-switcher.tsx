"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useActivePage, type PageInfo } from "@/lib/page-context";

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

function platformLabel(platform: string): string {
  return PLATFORM_META[platform]?.label ?? platform;
}

function platformColor(platform: string): string {
  return PLATFORM_META[platform]?.color ?? "#888";
}

/* ------------------------------------------------------------------ */
/*  Status indicator                                                   */
/* ------------------------------------------------------------------ */

function StatusDot({ isActive }: { isActive: boolean }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{
        background: isActive ? "var(--accent-emerald, #22c55e)" : "var(--accent-amber, #f59e0b)",
      }}
      aria-label={isActive ? "Active" : "Inactive"}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PageSwitcher() {
  const { activePage, allPages, switchPage } = useActivePage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  // Group pages by platform
  const grouped = allPages.reduce<Record<string, PageInfo[]>>((acc, page) => {
    const key = page.platform;
    if (!acc[key]) acc[key] = [];
    acc[key].push(page);
    return acc;
  }, {});

  /* No pages — show connect link */
  if (allPages.length === 0) {
    return (
      <Link
        href="/settings/connections"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--accent-blue)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-colors min-h-[36px]"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"
          />
        </svg>
        Connect a page
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-colors max-w-[220px] min-h-[36px]"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select page"
      >
        {/* Platform color dot */}
        {activePage && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: platformColor(activePage.platform) }}
          />
        )}

        {/* Label */}
        <span className="truncate text-[var(--text-primary)]">
          {activePage ? activePage.name : "Select page"}
        </span>

        {/* Platform badge */}
        {activePage && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: `${platformColor(activePage.platform)}20`,
              color: platformColor(activePage.platform),
            }}
          >
            {platformLabel(activePage.platform)}
          </span>
        )}

        {/* Chevron */}
        <svg
          className={`w-3 h-3 text-[var(--text-tertiary)] flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-primary)] shadow-xl py-1 z-50 max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Select page"
        >
          {Object.entries(grouped).map(([platform, pages]) => (
            <div key={platform}>
              {/* Section header */}
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: platformColor(platform) }}
                />
                {platformLabel(platform)} Pages
              </div>

              {pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  role="option"
                  aria-selected={page.id === activePage?.id}
                  onClick={() => {
                    switchPage(page.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <StatusDot isActive={page.isActive} />
                  <span className="truncate flex-1 text-left">{page.name}</span>
                  {page.id === activePage?.id && (
                    <svg
                      className="w-4 h-4 text-[var(--accent-blue)] flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          ))}

          {/* Footer: Connect New Page */}
          <div className="border-t border-[var(--border-secondary)] mt-1 pt-1">
            <Link
              href="/settings/connections"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-blue)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Connect New Page
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
