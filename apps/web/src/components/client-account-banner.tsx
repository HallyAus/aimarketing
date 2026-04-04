"use client";

import { useState, useEffect, useCallback } from "react";

export interface ClientActiveAccount {
  id: string;
  platform: string;
  name: string;
  type: string;
  connectionId: string;
}

const STORAGE_KEY = "reachpilot-active-account";

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  TWITTER_X: "Twitter/X",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  GOOGLE_ADS: "Google Ads",
  PINTEREST: "Pinterest",
  SNAPCHAT: "Snapchat",
};

function readActiveAccount(): ClientActiveAccount | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored || stored === "all") return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/** Hook that returns the active account and re-reads on account-changed events */
export function useActiveAccount() {
  const [account, setAccount] = useState<ClientActiveAccount | null>(null);

  const refresh = useCallback(() => {
    setAccount(readActiveAccount());
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("account-changed", handler);
    return () => window.removeEventListener("account-changed", handler);
  }, [refresh]);

  return account;
}

function clearFilter() {
  localStorage.setItem(STORAGE_KEY, "all");
  document.cookie = `reachpilot-active-page=${encodeURIComponent("all")};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("account-changed", { detail: null }));
}

export function ClientAccountBanner({
  account,
  onClear,
}: {
  account: ClientActiveAccount | null;
  onClear?: () => void;
}) {
  if (!account) return null;

  const platformLabel = PLATFORM_LABELS[account.platform] ?? account.platform;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-4"
      style={{
        background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(59,130,246,0.25)",
        color: "var(--accent-blue)",
      }}
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      <span>
        Filtered: <strong>{account.name}</strong> ({platformLabel})
      </span>
      <button
        type="button"
        onClick={() => {
          clearFilter();
          onClear?.();
        }}
        className="ml-auto flex items-center gap-1 hover:underline"
        style={{ color: "var(--accent-blue)" }}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Clear filter
      </button>
    </div>
  );
}
