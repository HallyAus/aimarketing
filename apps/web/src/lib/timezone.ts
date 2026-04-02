/**
 * Timezone utilities for AdPilot.
 * Stores user timezone in localStorage + cookie (no schema change needed).
 */

export const COMMON_TIMEZONES = [
  { value: "Pacific/Auckland", label: "Auckland (NZST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Australia/Adelaide", label: "Adelaide (ACST)" },
  { value: "Australia/Perth", label: "Perth (AWST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Kolkata", label: "Mumbai (IST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Europe/Moscow", label: "Moscow (MSK)" },
  { value: "Europe/Istanbul", label: "Istanbul (TRT)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "America/Sao_Paulo", label: "Sao Paulo (BRT)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "America/Chicago", label: "Chicago (CST)" },
  { value: "America/Denver", label: "Denver (MST)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
  { value: "Pacific/Honolulu", label: "Honolulu (HST)" },
] as const;

export function getUserTimezone(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("adpilot-timezone");
    if (saved) return saved;
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return "Australia/Sydney";
}

export function setUserTimezone(tz: string) {
  localStorage.setItem("adpilot-timezone", tz);
  document.cookie = `adpilot-timezone=${tz}; path=/; max-age=31536000`;
}

export function formatInTimezone(date: Date | string, tz?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-AU", {
    timeZone: tz || getUserTimezone(),
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
  });
}

export function formatTimeOnly(date: Date | string, tz?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-AU", {
    timeZone: tz || getUserTimezone(),
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Smart date formatter:
 * - Today 3:00 PM
 * - Tomorrow 9:00 AM
 * - Apr 5 6:00 PM
 */
export function formatSmartDate(date: Date | string, tz?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const timezone = tz || getUserTimezone();
  const now = new Date();

  const dateInTz = new Date(
    d.toLocaleString("en-US", { timeZone: timezone })
  );
  const nowInTz = new Date(
    now.toLocaleString("en-US", { timeZone: timezone })
  );

  const todayStart = new Date(nowInTz);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfterStart = new Date(tomorrowStart);
  dayAfterStart.setDate(dayAfterStart.getDate() + 1);

  const time = d.toLocaleString("en-AU", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (dateInTz >= todayStart && dateInTz < tomorrowStart) {
    return `Today ${time}`;
  }
  if (dateInTz >= tomorrowStart && dateInTz < dayAfterStart) {
    return `Tomorrow ${time}`;
  }

  const monthDay = d.toLocaleString("en-AU", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
  });
  return `${monthDay} ${time}`;
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const absDiff = Math.abs(diff);

  if (absDiff < 60000)
    return diff > 0 ? "in less than a minute" : "just now";
  if (absDiff < 3600000) {
    const mins = Math.round(absDiff / 60000);
    return diff > 0 ? `in ${mins}m` : `${mins}m ago`;
  }
  if (absDiff < 86400000) {
    const hrs = Math.floor(absDiff / 3600000);
    const mins = Math.round((absDiff % 3600000) / 60000);
    if (mins > 0) {
      return diff > 0 ? `in ${hrs}h ${mins}m` : `${hrs}h ${mins}m ago`;
    }
    return diff > 0 ? `in ${hrs}h` : `${hrs}h ago`;
  }
  const days = Math.round(absDiff / 86400000);
  return diff > 0 ? `in ${days}d` : `${days}d ago`;
}

/**
 * Get timezone offset string from cookie (for server-side usage).
 * Falls back to Australia/Sydney.
 */
export function getTimezoneFromCookie(
  cookieHeader: string | null
): string {
  if (!cookieHeader) return "Australia/Sydney";
  const match = cookieHeader.match(/adpilot-timezone=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "Australia/Sydney";
}
