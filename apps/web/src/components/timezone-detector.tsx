"use client";

import { useEffect } from "react";
import { detectBrowserTimezone } from "@/lib/timezone";

const COOKIE_NAME = "adpilot-timezone";
const COOKIE_MAX_AGE = 31536000; // 1 year in seconds

/**
 * Invisible client component that auto-detects the user's timezone on
 * first visit (or when it changes) and persists it to a cookie and
 * localStorage.
 *
 * Place this in the root layout so it runs on every page load:
 *
 *   <TimezoneDetector />
 *
 * It renders nothing visible.
 */
export function TimezoneDetector() {
  useEffect(() => {
    const detected = detectBrowserTimezone();
    if (!detected || detected === "UTC") return; // skip if detection failed

    // Check if we already have a stored timezone
    const existing = getCookie(COOKIE_NAME);
    if (existing === detected) return; // nothing to do

    // If no stored timezone, or if the browser timezone changed (e.g. user
    // traveled), update storage
    if (!existing) {
      persist(detected);
    }
    // If there IS an existing value but it differs, we do NOT overwrite --
    // the user may have manually chosen a timezone in settings. We only
    // auto-set on first visit.
  }, []);

  return null;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  );
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function persist(timezone: string) {
  // Cookie (readable by server components via next/headers)
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(timezone)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;

  // localStorage (readable by client components synchronously)
  try {
    localStorage.setItem(COOKIE_NAME, timezone);
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

export default TimezoneDetector;
