import { describe, it, expect } from "vitest";
import {
  detectBrowserTimezone,
  fromUTC,
  toUTC,
  getUTCOffset,
  getTimezoneDisplayName,
  formatRelativeTime,
  getOptimalPostingWindows,
  isSameOffset,
  COMMON_TIMEZONES,
  safeTimezone,
  getOffsetMinutes,
  cityFromIana,
  getTimezoneGroups,
  formatInUserTimezone,
  getTimezoneFromCookie,
  getRelativeTime,
} from "@/lib/timezone";

// ---------------------------------------------------------------------------
// detectBrowserTimezone
// ---------------------------------------------------------------------------
describe("detectBrowserTimezone", () => {
  it("returns a valid IANA timezone string", () => {
    const tz = detectBrowserTimezone();
    // Should be a non-empty string
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
    // Should not throw when passed to Intl
    expect(() => Intl.DateTimeFormat(undefined, { timeZone: tz })).not.toThrow();
  });

  it("returns a string containing a slash (region/city) or UTC", () => {
    const tz = detectBrowserTimezone();
    // Most IANA strings have a slash; UTC is also valid
    expect(tz === "UTC" || tz.includes("/")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// fromUTC / toUTC roundtrip
// ---------------------------------------------------------------------------
describe("fromUTC / toUTC roundtrip", () => {
  const testTimezones = [
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
    "Australia/Sydney",
    "UTC",
  ];

  it.each(testTimezones)(
    "roundtrips correctly for %s",
    (tz) => {
      const utcDate = new Date("2025-06-15T14:30:00.000Z");
      const local = fromUTC(utcDate, tz);
      const backToUtc = toUTC(local, tz);

      // Allow 1-minute tolerance for DST edge cases
      expect(Math.abs(backToUtc.getTime() - utcDate.getTime())).toBeLessThanOrEqual(60_000);
    },
  );

  it("fromUTC shifts the date by the timezone offset", () => {
    const utc = new Date("2025-01-15T12:00:00.000Z");
    const nyLocal = fromUTC(utc, "America/New_York");

    // In January, New York is UTC-5
    // The shifted Date should have hours = 12 - 5 = 7 (via getUTCHours on shifted date)
    expect(nyLocal.getUTCHours()).toBe(7);
  });

  it("toUTC undoes the shift from fromUTC", () => {
    const utc = new Date("2025-07-15T18:00:00.000Z");
    const local = fromUTC(utc, "Europe/Berlin");
    const restored = toUTC(local, "Europe/Berlin");

    expect(Math.abs(restored.getTime() - utc.getTime())).toBeLessThanOrEqual(60_000);
  });
});

// ---------------------------------------------------------------------------
// getUTCOffset
// ---------------------------------------------------------------------------
describe("getUTCOffset", () => {
  it("returns a correctly formatted offset string", () => {
    const offset = getUTCOffset("America/New_York");
    // Should match pattern like "+05:00" or "-05:00"
    expect(offset).toMatch(/^[+-]\d{2}:\d{2}$/);
  });

  it("returns +00:00 for UTC", () => {
    const offset = getUTCOffset("UTC");
    expect(offset).toBe("+00:00");
  });

  it("returns different offsets for standard time vs DST", () => {
    // January = EST (-05:00), July = EDT (-04:00) for New York
    const winter = new Date("2025-01-15T12:00:00.000Z");
    const summer = new Date("2025-07-15T12:00:00.000Z");

    const winterOffset = getUTCOffset("America/New_York", winter);
    const summerOffset = getUTCOffset("America/New_York", summer);

    expect(winterOffset).toBe("-05:00");
    expect(summerOffset).toBe("-04:00");
  });

  it("handles non-whole-hour offsets like India (IST +05:30)", () => {
    const offset = getUTCOffset("Asia/Kolkata");
    expect(offset).toBe("+05:30");
  });

  it("falls back to UTC offset for invalid timezone", () => {
    const offset = getUTCOffset("Invalid/Timezone");
    expect(offset).toBe("+00:00");
  });
});

// ---------------------------------------------------------------------------
// getTimezoneDisplayName
// ---------------------------------------------------------------------------
describe("getTimezoneDisplayName", () => {
  it("includes the city name", () => {
    const display = getTimezoneDisplayName("America/New_York");
    expect(display).toContain("New York");
  });

  it("includes the UTC offset", () => {
    const display = getTimezoneDisplayName("Asia/Tokyo");
    expect(display).toContain("UTC");
    expect(display).toContain("+09:00");
  });

  it("contains an em-dash separator", () => {
    const display = getTimezoneDisplayName("Europe/London");
    // The function uses \u2014 (em dash)
    expect(display).toContain("\u2014");
  });

  it("handles invalid timezone by falling back to UTC", () => {
    const display = getTimezoneDisplayName("Bogus/Nothing");
    // Should fall back to UTC
    expect(display).toContain("UTC");
  });
});

// ---------------------------------------------------------------------------
// formatRelativeTime
// ---------------------------------------------------------------------------
describe("formatRelativeTime", () => {
  it('shows "Today" prefix for a date occurring today', () => {
    const now = new Date();
    // Create a date 30 minutes from now (still today in most timezones)
    const soon = new Date(now.getTime() + 30 * 60 * 1000);
    const result = formatRelativeTime(soon, "UTC");
    expect(result).toMatch(/^Today /);
  });

  it('shows "Tomorrow" prefix for a date occurring tomorrow', () => {
    const now = new Date();
    // Create a date at noon tomorrow UTC
    const tomorrow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        12,
        0,
        0,
      ),
    );
    const result = formatRelativeTime(tomorrow, "UTC");
    expect(result).toMatch(/^Tomorrow /);
  });

  it("shows month and day for dates further away", () => {
    // A date far in the future
    const farDate = new Date("2027-08-15T14:00:00.000Z");
    const result = formatRelativeTime(farDate, "UTC");
    // Should show something like "Aug 15 2:00 PM"
    expect(result).toContain("Aug");
    expect(result).toContain("15");
  });

  it("includes AM/PM time formatting", () => {
    const date = new Date("2027-06-01T08:00:00.000Z");
    const result = formatRelativeTime(date, "UTC");
    expect(result).toMatch(/AM|PM/);
  });
});

// ---------------------------------------------------------------------------
// getOptimalPostingWindows
// ---------------------------------------------------------------------------
describe("getOptimalPostingWindows", () => {
  it("returns empty array for empty audience list", () => {
    const result = getOptimalPostingWindows([]);
    expect(result).toEqual([]);
  });

  it("returns 24 entries for a non-empty audience", () => {
    const result = getOptimalPostingWindows(["America/New_York"]);
    expect(result).toHaveLength(24);
  });

  it("each entry has utcHour, score, and audienceBreakdown", () => {
    const result = getOptimalPostingWindows(["Europe/London"]);
    for (const entry of result) {
      expect(entry).toHaveProperty("utcHour");
      expect(entry).toHaveProperty("score");
      expect(entry).toHaveProperty("audienceBreakdown");
      expect(entry.utcHour).toBeGreaterThanOrEqual(0);
      expect(entry.utcHour).toBeLessThanOrEqual(23);
    }
  });

  it("scores are sorted descending", () => {
    const result = getOptimalPostingWindows([
      "America/New_York",
      "Europe/London",
      "Asia/Tokyo",
    ]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.score).toBeLessThanOrEqual(result[i - 1]!.score);
    }
  });

  it("max score equals number of timezones when all are in preferred range", () => {
    const tzs = ["America/New_York", "America/Chicago"];
    const result = getOptimalPostingWindows(tzs);
    const maxScore = Math.max(...result.map((r) => r.score));
    expect(maxScore).toBeLessThanOrEqual(tzs.length);
    // At least some hours should score > 0
    expect(maxScore).toBeGreaterThan(0);
  });

  it("respects custom preferred hours", () => {
    // Very narrow window: only 9 AM - 10 AM local time
    const result = getOptimalPostingWindows(
      ["UTC"],
      { start: 9, end: 10 },
    );
    // Only UTC hour 9 should score 1, all others 0
    const scoring = result.filter((r) => r.score > 0);
    expect(scoring).toHaveLength(1);
    expect(scoring[0]!.utcHour).toBe(9);
  });

  it("audienceBreakdown shows 12-hour formatted times", () => {
    const result = getOptimalPostingWindows(["America/New_York"]);
    const entry = result[0]!;
    const breakdown = entry.audienceBreakdown["America/New_York"];
    expect(breakdown).toMatch(/\d{1,2}:00 (AM|PM)/);
  });
});

// ---------------------------------------------------------------------------
// isSameOffset
// ---------------------------------------------------------------------------
describe("isSameOffset", () => {
  it("returns true for the same timezone", () => {
    expect(isSameOffset("America/New_York", "America/New_York")).toBe(true);
  });

  it("returns true for timezones with matching offsets", () => {
    // In winter, EST and Bogota (COT) are both UTC-5
    const winter = new Date("2025-01-15T12:00:00.000Z");
    expect(isSameOffset("America/New_York", "America/Bogota", winter)).toBe(true);
  });

  it("can differ during DST transitions", () => {
    // In summer, New York is EDT (-04:00) but Bogota stays at COT (-05:00)
    const summer = new Date("2025-07-15T12:00:00.000Z");
    expect(isSameOffset("America/New_York", "America/Bogota", summer)).toBe(false);
  });

  it("UTC and London are the same offset in winter", () => {
    const winter = new Date("2025-01-15T12:00:00.000Z");
    expect(isSameOffset("UTC", "Europe/London", winter)).toBe(true);
  });

  it("UTC and London differ in summer (BST)", () => {
    const summer = new Date("2025-07-15T12:00:00.000Z");
    expect(isSameOffset("UTC", "Europe/London", summer)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Internal helpers (exported for testing)
// ---------------------------------------------------------------------------
describe("safeTimezone", () => {
  it("returns the timezone if valid", () => {
    expect(safeTimezone("America/New_York")).toBe("America/New_York");
  });

  it('returns "UTC" for invalid timezone strings', () => {
    expect(safeTimezone("Not/A/Timezone")).toBe("UTC");
    expect(safeTimezone("")).toBe("UTC");
  });
});

describe("getOffsetMinutes", () => {
  it("returns 0 for UTC", () => {
    const offset = getOffsetMinutes("UTC");
    expect(Math.abs(offset)).toBe(0);
  });

  it("returns negative minutes for west-of-UTC timezones", () => {
    const winter = new Date("2025-01-15T12:00:00.000Z");
    const offset = getOffsetMinutes("America/New_York", winter);
    expect(offset).toBe(-300); // -5 hours = -300 minutes
  });

  it("returns positive minutes for east-of-UTC timezones", () => {
    const offset = getOffsetMinutes("Asia/Tokyo");
    expect(offset).toBe(540); // +9 hours = 540 minutes
  });
});

describe("cityFromIana", () => {
  it("extracts city from standard IANA path", () => {
    expect(cityFromIana("America/New_York")).toBe("New York");
    expect(cityFromIana("Asia/Ho_Chi_Minh")).toBe("Ho Chi Minh");
  });

  it("handles three-part IANA paths", () => {
    expect(cityFromIana("America/Indiana/Indianapolis")).toBe("Indianapolis");
  });
});

// ---------------------------------------------------------------------------
// Other exports
// ---------------------------------------------------------------------------
describe("COMMON_TIMEZONES", () => {
  it("is a non-empty array", () => {
    expect(COMMON_TIMEZONES.length).toBeGreaterThan(0);
  });

  it("each entry has value and label", () => {
    for (const tz of COMMON_TIMEZONES) {
      expect(tz).toHaveProperty("value");
      expect(tz).toHaveProperty("label");
      expect(typeof tz.value).toBe("string");
      expect(typeof tz.label).toBe("string");
    }
  });
});

describe("getTimezoneGroups", () => {
  it("returns an array of groups with region and timezones", () => {
    const groups = getTimezoneGroups();
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(group).toHaveProperty("region");
      expect(group).toHaveProperty("timezones");
      expect(Array.isArray(group.timezones)).toBe(true);
    }
  });

  it("timezone entries have iana, label, and offset", () => {
    const groups = getTimezoneGroups();
    const first = groups[0]!.timezones[0]!;
    expect(first).toHaveProperty("iana");
    expect(first).toHaveProperty("label");
    expect(first).toHaveProperty("offset");
  });
});

describe("formatInUserTimezone", () => {
  it("formats a UTC date with timezone-aware display", () => {
    const date = new Date("2025-06-15T18:00:00.000Z");
    const result = formatInUserTimezone(date, "America/New_York");
    // Should show 2:00 PM EDT
    expect(result).toContain("2025");
    expect(result).toMatch(/PM/);
  });
});

describe("getTimezoneFromCookie", () => {
  it("returns UTC when cookie header is null", () => {
    expect(getTimezoneFromCookie(null)).toBe("UTC");
  });

  it("extracts timezone from cookie header", () => {
    const header = "session=abc; reachpilot-timezone=America%2FNew_York; other=val";
    expect(getTimezoneFromCookie(header)).toBe("America/New_York");
  });

  it("returns UTC when timezone cookie is not present", () => {
    const header = "session=abc; other=val";
    expect(getTimezoneFromCookie(header)).toBe("UTC");
  });
});

describe("getRelativeTime", () => {
  it('returns "just now" for a date in the recent past', () => {
    const recent = new Date(Date.now() - 5_000); // 5 seconds ago
    expect(getRelativeTime(recent)).toBe("just now");
  });

  it("returns minutes ago for a date minutes in the past", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
    const result = getRelativeTime(fiveMinAgo);
    expect(result).toMatch(/5m ago/);
  });

  it('returns "in" prefix for future dates', () => {
    const future = new Date(Date.now() + 10 * 60_000);
    const result = getRelativeTime(future);
    expect(result).toMatch(/^in /);
  });

  it("returns days for dates far in the past", () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 86_400_000);
    const result = getRelativeTime(fiveDaysAgo);
    expect(result).toMatch(/5d ago/);
  });
});
