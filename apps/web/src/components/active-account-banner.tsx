"use client";

import { useCallback } from "react";
import type { ActiveAccount } from "@/lib/active-account";

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

function clearFilter() {
  localStorage.setItem("adpilot-active-account", "all");
  document.cookie = `adpilot-active-page=${encodeURIComponent("all")};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("account-changed", { detail: null }));
  // Force page reload to re-run server queries
  window.location.reload();
}

export function ActiveAccountBanner({
  account,
}: {
  account: ActiveAccount | null;
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
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      <span>
        Filtered: <strong>{account.name}</strong> ({platformLabel})
      </span>
      <button
        type="button"
        onClick={clearFilter}
        className="ml-auto flex items-center gap-1 hover:underline min-h-[44px] px-2"
        style={{ color: "var(--accent-blue)" }}
        aria-label={`Clear filter for ${account.name}`}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Clear filter
      </button>
    </div>
  );
}
