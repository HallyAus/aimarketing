/**
 * Internationalization Formatting Utilities
 *
 * Centralizes all date, time, number, and currency formatting using the
 * browser-native Intl APIs. Default locale is US English ("en-US").
 *
 * These utilities should be used everywhere instead of raw
 * toLocaleDateString(), manual string formatting, or hardcoded "$" symbols.
 */

const DEFAULT_LOCALE = "en-US";

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

/**
 * Format a date into a human-readable string.
 *
 * @example formatDate(new Date()) // "Apr 3, 2026"
 * @example formatDate(new Date(), "de-DE") // "3. Apr. 2026"
 */
export function formatDate(
  date: Date,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(date);
}

/**
 * Format a time value.
 *
 * @example formatTime(new Date()) // "2:30 PM"
 * @example formatTime(new Date(), "en-GB") // "14:30"
 */
export function formatTime(
  date: Date,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(date);
}

/**
 * Format a date and time together.
 *
 * @example formatDateTime(new Date()) // "Apr 3, 2026, 2:30 PM"
 */
export function formatDateTime(
  date: Date,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(date);
}

// ---------------------------------------------------------------------------
// Relative date formatting
// ---------------------------------------------------------------------------

/**
 * Format a date relative to now, e.g. "2 hours ago", "yesterday", "in 3 days".
 * Falls back to an absolute date for anything older than 30 days.
 *
 * @example formatRelativeDate(new Date(Date.now() - 3600000)) // "1 hour ago"
 */
export function formatRelativeDate(
  date: Date,
  locale: string = DEFAULT_LOCALE,
): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffMs = date.getTime() - Date.now();
  const absDiffMs = Math.abs(diffMs);

  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMs / 3_600_000);
  const diffDays = Math.round(diffMs / 86_400_000);

  // Less than 1 minute
  if (absDiffMs < 60_000) {
    return rtf.format(diffSeconds, "second");
  }
  // Less than 1 hour
  if (absDiffMs < 3_600_000) {
    return rtf.format(diffMinutes, "minute");
  }
  // Less than 1 day
  if (absDiffMs < 86_400_000) {
    return rtf.format(diffHours, "hour");
  }
  // Less than 30 days
  if (absDiffMs < 2_592_000_000) {
    return rtf.format(diffDays, "day");
  }

  // Older than 30 days — fall back to absolute date
  return formatDate(date, locale);
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

/**
 * Format a number with locale-appropriate grouping separators.
 *
 * @example formatNumber(1234567) // "1,234,567"
 * @example formatNumber(1234567, "de-DE") // "1.234.567"
 */
export function formatNumber(
  num: number,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(num);
}

/**
 * Format a number in compact notation.
 *
 * @example formatCompact(1500) // "1.5K"
 * @example formatCompact(2300000) // "2.3M"
 */
export function formatCompact(
  num: number,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Format a decimal value as a percentage.
 *
 * @example formatPercent(0.156) // "15.6%"
 */
export function formatPercent(
  value: number,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Currency formatting
// ---------------------------------------------------------------------------

/**
 * Format a monetary amount with the appropriate currency symbol and grouping.
 *
 * @example formatCurrency(49.99, "USD") // "$49.99"
 * @example formatCurrency(49.99, "EUR", "de-DE") // "49,99 EUR"
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}
