"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ActiveAccount {
  id: string;
  platform: string;
  name: string;
  type: "page" | "account";
  connectionId: string;
}

const STORAGE_KEY = "adpilot-active-account";
const COOKIE_KEY = "adpilot-active-page";

/* ------------------------------------------------------------------ */
/*  Platform colors & icons                                            */
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
/*  Cookie helper                                                      */
/* ------------------------------------------------------------------ */

function setCookie(key: string, value: string) {
  document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AccountSelector() {
  const [accounts, setAccounts] = useState<ActiveAccount[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Load accounts on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/accounts/active");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        const list: ActiveAccount[] = data.accounts ?? [];
        setAccounts(list);

        // Restore selection from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "all") {
          setSelectedId("all");
        } else if (stored) {
          try {
            const parsed = JSON.parse(stored);
            const id = typeof parsed === "object" ? parsed.id : parsed;
            if (list.some((a) => a.id === id)) {
              setSelectedId(id);
            } else {
              setSelectedId("all");
              localStorage.setItem(STORAGE_KEY, "all");
              setCookie(COOKIE_KEY, "all");
            }
          } catch {
            // Legacy: stored value might be a plain id string
            if (list.some((a) => a.id === stored)) {
              setSelectedId(stored);
              // Migrate to JSON format
              const acc = list.find((a) => a.id === stored)!;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(acc));
              setCookie(COOKIE_KEY, JSON.stringify(acc));
            } else {
              setSelectedId("all");
              localStorage.setItem(STORAGE_KEY, "all");
              setCookie(COOKIE_KEY, "all");
            }
          }
        } else {
          // Default to "all"
          setSelectedId("all");
          localStorage.setItem(STORAGE_KEY, "all");
          setCookie(COOKIE_KEY, "all");
        }
      } catch {
        // silently fail
      }
      setLoading(false);
    }
    load();
  }, []);

  const selectAll = useCallback(() => {
    setSelectedId("all");
    localStorage.setItem(STORAGE_KEY, "all");
    setCookie(COOKIE_KEY, "all");
    setOpen(false);
    window.dispatchEvent(new CustomEvent("account-changed", { detail: null }));
  }, []);

  const select = useCallback(
    (acc: ActiveAccount) => {
      setSelectedId(acc.id);
      const json = JSON.stringify(acc);
      localStorage.setItem(STORAGE_KEY, json);
      setCookie(COOKIE_KEY, json);
      setOpen(false);
      // Dispatch event so other components can react
      window.dispatchEvent(new CustomEvent("account-changed", { detail: acc }));
    },
    [],
  );

  const selected = accounts.find((a) => a.id === selectedId);

  // Group accounts by platform
  const grouped = accounts.reduce<Record<string, ActiveAccount[]>>((acc, a) => {
    const key = a.platform;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(a);
    return acc;
  }, {});

  /* -- No accounts state -- */
  if (!loading && accounts.length === 0) {
    return (
      <Link
        href="/settings/connections"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--accent-blue)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
        </svg>
        Connect accounts
      </Link>
    );
  }

  /* -- Loading state -- */
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
        <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
        Loading...
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-colors max-w-[200px]"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selected && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: platformColor(selected.platform) }}
          />
        )}
        {!selected && selectedId === "all" && (
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--text-tertiary)" }} />
        )}
        <span className="truncate text-[var(--text-primary)]">
          {selectedId === "all" ? "All Accounts" : selected?.name ?? "Select account"}
        </span>
        <svg
          className={`w-3 h-3 text-[var(--text-tertiary)] flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-primary)] shadow-xl py-1 z-50 max-h-80 overflow-y-auto"
          role="listbox"
          aria-label="Select account"
        >
          {/* All accounts option */}
          <button
            type="button"
            role="option"
            aria-selected={selectedId === "all"}
            onClick={selectAll}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--text-tertiary)" }} />
            <span className="truncate flex-1 text-left">All Accounts</span>
            {selectedId === "all" && (
              <svg className="w-4 h-4 text-[var(--accent-blue)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <div className="border-t border-[var(--border-secondary)] my-1" />

          {Object.entries(grouped).map(([platform, accs]) => (
            <div key={platform}>
              {/* Section header */}
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: platformColor(platform) }}
                />
                {platformLabel(platform)} {accs[0]?.type === "page" ? "Pages" : ""}
              </div>

              {accs.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  role="option"
                  aria-selected={acc.id === selectedId}
                  onClick={() => select(acc)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: platformColor(acc.platform) }}
                  />
                  <span className="truncate flex-1 text-left">{acc.name}</span>
                  {acc.id === selectedId && (
                    <svg className="w-4 h-4 text-[var(--accent-blue)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          ))}

          {/* Footer link */}
          <div className="border-t border-[var(--border-secondary)] mt-1 pt-1">
            <Link
              href="/settings/connections"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--accent-blue)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Manage connections
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
