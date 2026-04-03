/**
 * Timezone utilities for AdPilot.
 *
 * Comprehensive timezone infrastructure for a global SaaS marketing
 * automation platform. Uses built-in Intl APIs exclusively -- no
 * additional npm dependencies required.
 *
 * All dates flow through the system as UTC. Conversion to/from user
 * timezones happens only at the display and input boundaries.
 */

// ---------------------------------------------------------------------------
// Legacy exports (preserved for backwards compatibility)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Validate an IANA timezone string. Returns the string if valid, "UTC" otherwise. */
function safeTimezone(tz: string): string {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

/**
 * Get the numeric UTC offset in minutes for an IANA timezone at a given moment.
 * Positive = east of UTC (e.g. +600 for Australia/Sydney AEST).
 */
function getOffsetMinutes(iana: string, atDate: Date = new Date()): number {
  const tz = safeTimezone(iana);

  // Format the date parts in the target timezone
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(atDate)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  // Build a pseudo-UTC date from the timezone-local parts
  const localInTz = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) === 24 ? 0 : Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return Math.round((localInTz - atDate.getTime()) / 60_000);
}

/**
 * Extract the city name from an IANA timezone string.
 * "America/New_York" -> "New York", "Asia/Ho_Chi_Minh" -> "Ho Chi Minh"
 */
function cityFromIana(iana: string): string {
  const parts = iana.split("/");
  const city = parts[parts.length - 1] ?? iana;
  return city.replace(/_/g, " ");
}

// ---------------------------------------------------------------------------
// Core public API
// ---------------------------------------------------------------------------

/**
 * Detect the browser timezone using the Intl API.
 * Returns an IANA string like "America/New_York".
 * Falls back to "UTC" if detection fails.
 */
export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Convert a UTC Date to a specific timezone, returning a new Date whose
 * `.getHours()` / `.getMinutes()` etc. reflect the wall-clock time in
 * that timezone.
 *
 * NOTE: The returned Date object's internal timestamp is *shifted* so that
 * standard getters show local-in-tz values. Do NOT pass it to APIs that
 * expect a true UTC timestamp.
 */
export function fromUTC(utcDate: Date, timezone: string): Date {
  const tz = safeTimezone(timezone);
  const offsetMin = getOffsetMinutes(tz, utcDate);
  return new Date(utcDate.getTime() + offsetMin * 60_000);
}

/**
 * Convert a local date (representing wall-clock time in a timezone) back
 * to UTC. This is the inverse of `fromUTC`.
 */
export function toUTC(localDate: Date, timezone: string): Date {
  const tz = safeTimezone(timezone);
  // We need the offset at the *UTC moment* that corresponds to localDate.
  // Estimate first, then refine.
  const estimatedUtc = new Date(
    localDate.getTime() - getOffsetMinutes(tz, localDate) * 60_000
  );
  // Refine with the offset at the estimated UTC moment
  const refinedOffset = getOffsetMinutes(tz, estimatedUtc);
  return new Date(localDate.getTime() - refinedOffset * 60_000);
}

/**
 * Format a UTC date in a user's timezone using Intl.DateTimeFormat.
 *
 * @param utcDate   The date in UTC.
 * @param timezone  IANA timezone string.
 * @param options   Optional Intl.DateTimeFormatOptions overrides.
 */
export function formatInUserTimezone(
  utcDate: Date,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const tz = safeTimezone(timezone);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  };
  return new Intl.DateTimeFormat("en-US", {
    ...defaultOptions,
    ...options,
    timeZone: tz,
  }).format(utcDate);
}

/**
 * Get a human-friendly display name for an IANA timezone.
 * Example: "Pacific Time - Los Angeles (UTC-07:00)"
 */
export function getTimezoneDisplayName(iana: string): string {
  const tz = safeTimezone(iana);
  const city = cityFromIana(tz);
  const offset = getUTCOffset(tz);

  // Try to get the long timezone name (e.g. "Pacific Standard Time")
  try {
    const longName = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "long",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;

    if (longName) {
      // Shorten "Pacific Standard Time" -> "Pacific Time" etc.
      const shortName = longName
        .replace(/ (Standard|Daylight|Summer)/, "")
        .trim();
      return `${shortName} \u2014 ${city} (UTC${offset})`;
    }
  } catch {
    // fall through
  }

  return `${city} (UTC${offset})`;
}

/**
 * Get UTC offset string like "+10:00" or "-04:00".
 * DST-aware: computes the offset for the given date (defaults to now).
 */
export function getUTCOffset(iana: string, atDate: Date = new Date()): string {
  const tz = safeTimezone(iana);
  const totalMinutes = getOffsetMinutes(tz, atDate);
  const sign = totalMinutes >= 0 ? "+" : "-";
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Get all IANA timezones grouped by region for a searchable dropdown.
 * Uses `Intl.supportedValuesOf('timeZone')` (Node 18+ / modern browsers).
 */
export function getTimezoneGroups(): Array<{
  region: string;
  timezones: Array<{ iana: string; label: string; offset: string }>;
}> {
  let allTimezones: string[];
  try {
    allTimezones = Intl.supportedValuesOf("timeZone");
  } catch {
    // Fallback for older environments
    allTimezones = COMMON_TIMEZONES.map((t) => t.value);
  }

  const grouped = new Map<
    string,
    Array<{ iana: string; label: string; offset: string }>
  >();

  const now = new Date();
  for (const iana of allTimezones) {
    const parts = iana.split("/");
    if (parts.length < 2) continue; // skip "UTC", "GMT" etc.
    const region = parts[0] ?? "Other";
    const city = cityFromIana(iana);
    const offset = getUTCOffset(iana, now);

    if (!grouped.has(region)) {
      grouped.set(region, []);
    }
    grouped.get(region)!.push({
      iana,
      label: `${city} (UTC${offset})`,
      offset,
    });
  }

  // Sort timezones within each region by offset then city name
  const result: Array<{
    region: string;
    timezones: Array<{ iana: string; label: string; offset: string }>;
  }> = [];

  for (const [region, timezones] of grouped) {
    timezones.sort((a, b) => {
      if (a.offset !== b.offset) return a.offset.localeCompare(b.offset);
      return a.label.localeCompare(b.label);
    });
    result.push({ region, timezones });
  }

  // Sort regions alphabetically
  result.sort((a, b) => a.region.localeCompare(b.region));
  return result;
}

/**
 * Calculate optimal posting time across multiple audience timezones.
 *
 * For each UTC hour (0-23), scores how many audience timezones fall within
 * "good engagement hours" (default 8 AM - 9 PM local time). Returns all
 * 24 hours sorted by score descending.
 *
 * @param audienceTimezones  Array of IANA timezone strings.
 * @param preferredHours     Local hour range considered "good" (default 8-21).
 */
export function getOptimalPostingWindows(
  audienceTimezones: string[],
  preferredHours: { start: number; end: number } = { start: 8, end: 21 }
): Array<{
  utcHour: number;
  score: number;
  audienceBreakdown: Record<string, string>;
}> {
  if (audienceTimezones.length === 0) return [];

  const now = new Date();
  const validTimezones = audienceTimezones.map((tz) => safeTimezone(tz));

  const results: Array<{
    utcHour: number;
    score: number;
    audienceBreakdown: Record<string, string>;
  }> = [];

  for (let utcHour = 0; utcHour < 24; utcHour++) {
    // Create a reference date at this UTC hour
    const refDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, 0, 0)
    );

    let score = 0;
    const breakdown: Record<string, string> = {};

    for (const tz of validTimezones) {
      const offsetMin = getOffsetMinutes(tz, refDate);
      const localHour = ((utcHour * 60 + offsetMin) % 1440 + 1440) % 1440 / 60;
      const localHourFloor = Math.floor(localHour);

      // Format as 12-hour time for the breakdown
      const displayHour = localHourFloor % 12 || 12;
      const ampm = localHourFloor < 12 ? "AM" : "PM";
      breakdown[tz] = `${displayHour}:00 ${ampm}`;

      // Score: 1 point if within preferred range
      if (localHourFloor >= preferredHours.start && localHourFloor < preferredHours.end) {
        score += 1;
      }
    }

    results.push({ utcHour, score, audienceBreakdown: breakdown });
  }

  // Sort by score descending, then by UTC hour ascending for ties
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.utcHour - b.utcHour;
  });

  return results;
}

/**
 * Format relative time in user's timezone.
 * - "Today 9:00 AM"
 * - "Tomorrow 3:00 PM"
 * - "Apr 5 6:00 PM"  (for dates further away)
 */
export function formatRelativeTime(utcDate: Date, timezone: string): string {
  const tz = safeTimezone(timezone);
  const now = new Date();

  // Get today's date boundaries in the target timezone
  const dateInTz = new Date(
    utcDate.toLocaleString("en-US", { timeZone: tz })
  );
  const nowInTz = new Date(
    now.toLocaleString("en-US", { timeZone: tz })
  );

  const todayStart = new Date(nowInTz);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfterStart = new Date(tomorrowStart);
  dayAfterStart.setDate(dayAfterStart.getDate() + 1);

  const timeStr = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(utcDate);

  if (dateInTz >= todayStart && dateInTz < tomorrowStart) {
    return `Today ${timeStr}`;
  }
  if (dateInTz >= tomorrowStart && dateInTz < dayAfterStart) {
    return `Tomorrow ${timeStr}`;
  }

  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    month: "short",
    day: "numeric",
  }).format(utcDate);

  return `${dateStr} ${timeStr}`;
}

/**
 * Check if two IANA timezones have the same UTC offset at a given moment.
 * They may differ during DST transitions.
 */
export function isSameOffset(
  tz1: string,
  tz2: string,
  atDate: Date = new Date()
): boolean {
  return getOffsetMinutes(safeTimezone(tz1), atDate) === getOffsetMinutes(safeTimezone(tz2), atDate);
}

// ---------------------------------------------------------------------------
// Legacy convenience functions (kept for backwards compatibility)
// ---------------------------------------------------------------------------

/** @deprecated Use `detectBrowserTimezone()` or the cookie-based approach. */
export function getUserTimezone(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("adpilot-timezone");
    if (saved) return saved;
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return "UTC";
}

export function setUserTimezone(tz: string): void {
  localStorage.setItem("adpilot-timezone", tz);
  document.cookie = `adpilot-timezone=${tz}; path=/; max-age=31536000; SameSite=Lax`;
}

export function formatInTimezone(date: Date | string, tz?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
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
  return d.toLocaleString("en-US", {
    timeZone: tz || getUserTimezone(),
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** @deprecated Use `formatRelativeTime()` instead. */
export function formatSmartDate(date: Date | string, tz?: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatRelativeTime(d, tz || getUserTimezone());
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
 * Get timezone from cookie header string (for server-side usage in
 * middleware or API routes where `next/headers` is not available).
 */
export function getTimezoneFromCookie(cookieHeader: string | null): string {
  if (!cookieHeader) return "UTC";
  const match = cookieHeader.match(/adpilot-timezone=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : "UTC";
}

// ---------------------------------------------------------------------------
// Exported helpers for internal use by components
// ---------------------------------------------------------------------------

export { safeTimezone, getOffsetMinutes, cityFromIana };
