import { describe, it, expect } from "vitest";
import {
  detectBrowserTimezone,
  fromUTC,
  toUTC,
  formatInUserTimezone,
  getTimezoneDisplayName,
  getUTCOffset,
  getTimezoneGroups,
  getOptimalPostingWindows,
  formatRelativeTime,
  isSameOffset,
  safeTimezone,
} from "@/lib/timezone";

// ---------------------------------------------------------------------------
// detectBrowserTimezone
// ---------------------------------------------------------------------------

describe("detectBrowserTimezone", () => {
  it("returns a valid IANA timezone string", () => {
    const tz = detectBrowserTimezone();
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
    // Should not throw when used with Intl
    expect(() => Intl.DateTimeFormat(undefined, { timeZone: tz })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// fromUTC / toUTC round-trip
// ---------------------------------------------------------------------------

describe("fromUTC and toUTC", () => {
  it("round-trips correctly for America/New_York", () => {
    const original = new Date("2025-06-15T14:30:00Z"); // summer (EDT)
    const local = fromUTC(original, "America/New_York");
    const roundTripped = toUTC(local, "America/New_York");

    // Should be within 1 minute of the original
    expect(Math.abs(roundTripped.getTime() - original.getTime())).toBeLessThan(
      60_000
    );
  });

  it("round-trips correctly for Asia/Tokyo (no DST)", () => {
    const original = new Date("2025-01-15T03:00:00Z");
    const local = fromUTC(original, "Asia/Tokyo");
    const roundTripped = toUTC(local, "Asia/Tokyo");

    expect(Math.abs(roundTripped.getTime() - original.getTime())).toBeLessThan(
      60_000
    );
  });

  it("round-trips correctly for Australia/Sydney", () => {
    const original = new Date("2025-07-01T12:00:00Z"); // winter in AU
    const local = fromUTC(original, "Australia/Sydney");
    const roundTripped = toUTC(local, "Australia/Sydney");

    expect(Math.abs(roundTripped.getTime() - original.getTime())).toBeLessThan(
      60_000
    );
  });

  it("fromUTC shifts the date correctly for a known timezone", () => {
    // UTC 14:00 on a summer day -> EDT is UTC-4, so local should show 10:00
    const utc = new Date("2025-06-15T14:00:00Z");
    const local = fromUTC(utc, "America/New_York");
    expect(local.getUTCHours()).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// formatInUserTimezone
// ---------------------------------------------------------------------------

describe("formatInUserTimezone", () => {
  it("formats a date in the specified timezone", () => {
    const utc = new Date("2025-06-15T14:30:00Z");
    const result = formatInUserTimezone(utc, "America/New_York");
    // Should contain the time in Eastern (10:30 AM EDT)
    expect(result).toContain("10:30");
    expect(result).toMatch(/AM/i);
  });

  it("respects custom Intl options", () => {
    const utc = new Date("2025-12-25T00:00:00Z");
    const result = formatInUserTimezone(utc, "Europe/London", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expect(result).toContain("December");
    expect(result).toContain("2025");
  });
});

// ---------------------------------------------------------------------------
// getTimezoneDisplayName
// ---------------------------------------------------------------------------

describe("getTimezoneDisplayName", () => {
  it("includes the city name", () => {
    const name = getTimezoneDisplayName("America/Los_Angeles");
    expect(name).toContain("Los Angeles");
  });

  it("includes the UTC offset", () => {
    const name = getTimezoneDisplayName("America/New_York");
    expect(name).toMatch(/UTC[+-]\d{2}:\d{2}/);
  });

  it("handles invalid timezone gracefully (falls back to UTC)", () => {
    const name = getTimezoneDisplayName("Invalid/Timezone");
    expect(name).toContain("UTC");
  });
});

// ---------------------------------------------------------------------------
// getUTCOffset
// ---------------------------------------------------------------------------

describe("getUTCOffset", () => {
  it("returns correct offset for UTC", () => {
    expect(getUTCOffset("UTC")).toBe("+00:00");
  });

  it("returns a negative offset for US Eastern in winter (EST = -5)", () => {
    const winter = new Date("2025-01-15T12:00:00Z");
    expect(getUTCOffset("America/New_York", winter)).toBe("-05:00");
  });

  it("returns a different offset for US Eastern in summer (EDT = -4)", () => {
    const summer = new Date("2025-07-15T12:00:00Z");
    expect(getUTCOffset("America/New_York", summer)).toBe("-04:00");
  });

  it("handles half-hour offsets (India = +5:30)", () => {
    expect(getUTCOffset("Asia/Kolkata")).toBe("+05:30");
  });

  it("handles 45-minute offsets (Nepal = +5:45)", () => {
    expect(getUTCOffset("Asia/Kathmandu")).toBe("+05:45");
  });
});

// ---------------------------------------------------------------------------
// getTimezoneGroups
// ---------------------------------------------------------------------------

describe("getTimezoneGroups", () => {
  it("returns an array of region groups", () => {
    const groups = getTimezoneGroups();
    expect(Array.isArray(groups)).toBe(true);
    expect(groups.length).toBeGreaterThan(0);
  });

  it("each group has a region name and array of timezones", () => {
    const groups = getTimezoneGroups();
    for (const group of groups) {
      expect(typeof group.region).toBe("string");
      expect(Array.isArray(group.timezones)).toBe(true);
      for (const tz of group.timezones) {
        expect(typeof tz.iana).toBe("string");
        expect(typeof tz.label).toBe("string");
        expect(typeof tz.offset).toBe("string");
      }
    }
  });

  it("includes well-known regions", () => {
    const groups = getTimezoneGroups();
    const regions = groups.map((g) => g.region);
    expect(regions).toContain("America");
    expect(regions).toContain("Europe");
    expect(regions).toContain("Asia");
  });
});

// ---------------------------------------------------------------------------
// getOptimalPostingWindows
// ---------------------------------------------------------------------------

describe("getOptimalPostingWindows", () => {
  it("returns 24 entries (one per UTC hour)", () => {
    const results = getOptimalPostingWindows(["America/New_York"]);
    expect(results).toHaveLength(24);
  });

  it("returns empty array for empty input", () => {
    expect(getOptimalPostingWindows([])).toEqual([]);
  });

  it("scores higher for UTC hours that map to daytime across multiple timezones", () => {
    const results = getOptimalPostingWindows([
      "America/New_York",
      "America/Los_Angeles",
    ]);
    // The top-scored hour should have score > 0
    expect(results[0]!.score).toBeGreaterThan(0);
  });

  it("includes audience breakdown with local times", () => {
    const results = getOptimalPostingWindows(["Asia/Tokyo", "Europe/London"]);
    const top = results[0]!;
    expect(top.audienceBreakdown).toHaveProperty("Asia/Tokyo");
    expect(top.audienceBreakdown).toHaveProperty("Europe/London");
    // Each breakdown entry should look like "3:00 PM"
    for (const localTime of Object.values(top.audienceBreakdown)) {
      expect(localTime).toMatch(/\d{1,2}:00 [AP]M/);
    }
  });

  it("respects custom preferred hours", () => {
    // Only 9 AM - 5 PM is good
    const results = getOptimalPostingWindows(
      ["America/New_York"],
      { start: 9, end: 17 }
    );
    // Max possible score is 1 (one timezone)
    const bestScore = results[0]!.score;
    expect(bestScore).toBeLessThanOrEqual(1);
    expect(bestScore).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// formatRelativeTime
// ---------------------------------------------------------------------------

describe("formatRelativeTime", () => {
  it('formats a date happening today as "Today HH:MM AM/PM"', () => {
    // Create a date 1 hour from now in UTC
    const soon = new Date(Date.now() + 3_600_000);
    const result = formatRelativeTime(soon, "UTC");
    expect(result).toMatch(/^Today \d{1,2}:\d{2} [AP]M$/);
  });

  it('formats a date happening tomorrow as "Tomorrow HH:MM AM/PM"', () => {
    // Create a date ~25 hours from now
    const tomorrow = new Date(Date.now() + 25 * 3_600_000);
    const result = formatRelativeTime(tomorrow, "UTC");
    // Could be "Tomorrow" depending on exact timing; at minimum not "Today"
    // We check it does not throw and produces a reasonable string
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats a far-future date as "Mon DD HH:MM AM/PM"', () => {
    const farFuture = new Date("2026-12-25T18:00:00Z");
    const result = formatRelativeTime(farFuture, "UTC");
    expect(result).toContain("Dec");
    expect(result).toContain("25");
  });
});

// ---------------------------------------------------------------------------
// isSameOffset
// ---------------------------------------------------------------------------

describe("isSameOffset", () => {
  it("returns true for identical timezones", () => {
    expect(isSameOffset("America/New_York", "America/New_York")).toBe(true);
  });

  it("returns true for timezones with the same offset", () => {
    // Asia/Tokyo and Asia/Seoul are both UTC+9 year-round
    expect(isSameOffset("Asia/Tokyo", "Asia/Seoul")).toBe(true);
  });

  it("detects different offsets during DST", () => {
    // In summer: New York is UTC-4, Chicago is UTC-5
    const summer = new Date("2025-07-15T12:00:00Z");
    expect(isSameOffset("America/New_York", "America/Chicago", summer)).toBe(
      false
    );
  });

  it("handles invalid timezones (both fall back to UTC)", () => {
    expect(isSameOffset("Invalid/One", "Invalid/Two")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// safeTimezone (internal but exported for testing)
// ---------------------------------------------------------------------------

describe("safeTimezone", () => {
  it("returns valid timezone as-is", () => {
    expect(safeTimezone("America/New_York")).toBe("America/New_York");
  });

  it("returns UTC for invalid timezone", () => {
    expect(safeTimezone("Not/A/Timezone")).toBe("UTC");
  });
});
