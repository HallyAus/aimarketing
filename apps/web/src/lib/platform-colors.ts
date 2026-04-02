/**
 * Shared platform color constants.
 * Single source of truth -- import from here everywhere.
 */

/** Brand hex colors for each platform */
export const PLATFORM_COLORS: Record<string, string> = {
  FACEBOOK: "#1877f2",
  INSTAGRAM: "#e4405f",
  LINKEDIN: "#0a66c2",
  TWITTER_X: "#1da1f2",
  TIKTOK: "#ff0050",
  YOUTUBE: "#ff0000",
  PINTEREST: "#e60023",
  GOOGLE_ADS: "#4285f4",
  SNAPCHAT: "#fffc00",
};

/** Human-readable labels */
export const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  TWITTER_X: "Twitter/X",
  TIKTOK: "TikTok",
  YOUTUBE: "YouTube",
  PINTEREST: "Pinterest",
  GOOGLE_ADS: "Google Ads",
  SNAPCHAT: "Snapchat",
};

/** CSS-variable-based theme-safe colors for badges and UI elements */
export const PLATFORM_THEME: Record<string, { bg: string; text: string }> = {
  FACEBOOK:   { bg: "var(--accent-blue-muted)",    text: "var(--accent-blue)" },
  INSTAGRAM:  { bg: "var(--accent-purple-muted)",  text: "var(--accent-purple)" },
  TIKTOK:     { bg: "var(--accent-emerald-muted)", text: "var(--accent-emerald)" },
  LINKEDIN:   { bg: "var(--accent-blue-muted)",    text: "var(--accent-blue)" },
  TWITTER_X:  { bg: "var(--bg-elevated)",          text: "var(--text-secondary)" },
  YOUTUBE:    { bg: "var(--accent-red-muted)",      text: "var(--accent-red)" },
  GOOGLE_ADS: { bg: "var(--accent-amber-muted)",   text: "var(--accent-amber)" },
  PINTEREST:  { bg: "var(--accent-red-muted)",      text: "var(--accent-red)" },
  SNAPCHAT:   { bg: "var(--accent-amber-muted)",   text: "var(--accent-amber)" },
};

/** CSS-variable accent color for calendar border-left, etc. */
export const PLATFORM_ACCENT: Record<string, string> = {
  FACEBOOK:   "var(--accent-blue)",
  INSTAGRAM:  "var(--accent-purple)",
  TIKTOK:     "var(--accent-emerald)",
  LINKEDIN:   "var(--accent-blue)",
  TWITTER_X:  "var(--text-secondary)",
  YOUTUBE:    "var(--accent-red)",
  GOOGLE_ADS: "var(--accent-emerald)",
  PINTEREST:  "var(--accent-red)",
  SNAPCHAT:   "var(--accent-amber)",
};

export function getPlatformColor(platform: string): string {
  return PLATFORM_COLORS[platform] ?? "#6b7280";
}

export function getPlatformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform.replace(/_/g, " ");
}

export function getPlatformTheme(platform: string) {
  return PLATFORM_THEME[platform] ?? { bg: "var(--bg-elevated)", text: "var(--text-secondary)" };
}

export function getPlatformAccent(platform: string): string {
  return PLATFORM_ACCENT[platform] ?? "var(--border-primary)";
}
