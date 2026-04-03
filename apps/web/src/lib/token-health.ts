/**
 * Token Health Check Utility
 *
 * Evaluates the health status of OAuth tokens for connected platform accounts.
 * Used by the UI to display token health indicators and by background jobs
 * to proactively refresh expiring tokens.
 */

import type { Platform } from "@adpilot/platform-sdk";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TokenHealthStatus =
  | "HEALTHY"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "REFRESH_FAILED"
  | "REVOKED"
  | "UNKNOWN";

export interface TokenHealthResult {
  status: TokenHealthStatus;
  /** Human-readable label for the status */
  label: string;
  /** CSS color variable or hex for the indicator */
  color: string;
  /** How many seconds remain until the token expires, or null if unknown */
  remainingSeconds: number | null;
  /** Human-readable time remaining, e.g. "14 days", "2 hours" */
  remainingLabel: string | null;
  /** Whether the user should be prompted to reconnect */
  requiresAction: boolean;
}

// ---------------------------------------------------------------------------
// Platform token TTL configuration (seconds)
// ---------------------------------------------------------------------------

export const TOKEN_TTL: Record<Platform, { accessTokenTTL: number | null; supportsRefresh: boolean }> = {
  FACEBOOK: { accessTokenTTL: 5_184_000, supportsRefresh: false }, // 60 days
  INSTAGRAM: { accessTokenTTL: 5_184_000, supportsRefresh: false }, // 60 days
  TIKTOK: { accessTokenTTL: 86_400, supportsRefresh: true }, // 24 hours
  TWITTER_X: { accessTokenTTL: 7_200, supportsRefresh: true }, // 2 hours
  LINKEDIN: { accessTokenTTL: 5_184_000, supportsRefresh: true }, // 60 days
  YOUTUBE: { accessTokenTTL: 3_600, supportsRefresh: true }, // 1 hour
  GOOGLE_ADS: { accessTokenTTL: 3_600, supportsRefresh: true }, // 1 hour
  PINTEREST: { accessTokenTTL: 2_592_000, supportsRefresh: true }, // 30 days
  SNAPCHAT: { accessTokenTTL: 1_800, supportsRefresh: true }, // 30 minutes
};

// ---------------------------------------------------------------------------
// Health calculation
// ---------------------------------------------------------------------------

/**
 * Calculate token health for a platform connection.
 *
 * @param platform     - The platform enum value
 * @param tokenExpiresAt - The token expiration date, or null if unknown
 * @param connectionStatus - The connection status from the DB ("ACTIVE" | "EXPIRED" | "REVOKED")
 */
export function calculateTokenHealth(
  platform: Platform,
  tokenExpiresAt: Date | null,
  connectionStatus: string,
): TokenHealthResult {
  // Handle revoked connections
  if (connectionStatus === "REVOKED") {
    return {
      status: "REVOKED",
      label: "Revoked",
      color: "var(--accent-red, #ef4444)",
      remainingSeconds: null,
      remainingLabel: null,
      requiresAction: true,
    };
  }

  // Handle explicitly expired status in DB
  if (connectionStatus === "EXPIRED") {
    return {
      status: "EXPIRED",
      label: "Expired",
      color: "var(--accent-red, #ef4444)",
      remainingSeconds: 0,
      remainingLabel: "Expired",
      requiresAction: true,
    };
  }

  // No expiry date stored — assume healthy (some platforms never expire)
  if (!tokenExpiresAt) {
    return {
      status: "HEALTHY",
      label: "Connected",
      color: "var(--accent-green, #22c55e)",
      remainingSeconds: null,
      remainingLabel: null,
      requiresAction: false,
    };
  }

  const now = Date.now();
  const expiresAtMs = tokenExpiresAt.getTime();
  const remainingMs = expiresAtMs - now;
  const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

  // Already expired
  if (remainingMs <= 0) {
    return {
      status: "EXPIRED",
      label: "Expired",
      color: "var(--accent-red, #ef4444)",
      remainingSeconds: 0,
      remainingLabel: "Expired",
      requiresAction: true,
    };
  }

  const config = TOKEN_TTL[platform];
  const ttl = config?.accessTokenTTL;

  // If we know the TTL, check whether we're within the warning threshold (20%)
  if (ttl && remainingSeconds < ttl * 0.2) {
    return {
      status: "EXPIRING_SOON",
      label: "Expiring soon",
      color: "var(--accent-amber, #f59e0b)",
      remainingSeconds,
      remainingLabel: formatRemainingTime(remainingSeconds),
      requiresAction: !config.supportsRefresh, // only requires action if no auto-refresh
    };
  }

  return {
    status: "HEALTHY",
    label: "Connected",
    color: "var(--accent-green, #22c55e)",
    remainingSeconds,
    remainingLabel: formatRemainingTime(remainingSeconds),
    requiresAction: false,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format seconds into a human-readable remaining time string.
 */
function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return "Expired";

  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  if (days > 1) return `${days} days`;
  if (days === 1) return "1 day";
  if (hours > 1) return `${hours} hours`;
  if (hours === 1) return "1 hour";
  if (minutes > 1) return `${minutes} minutes`;
  return "less than a minute";
}

/**
 * Determine the appropriate indicator icon name for a health status.
 * Useful for rendering icons in UI components.
 */
export function tokenHealthIcon(status: TokenHealthStatus): "check" | "warning" | "error" | "unknown" {
  switch (status) {
    case "HEALTHY":
      return "check";
    case "EXPIRING_SOON":
      return "warning";
    case "EXPIRED":
    case "REFRESH_FAILED":
    case "REVOKED":
      return "error";
    default:
      return "unknown";
  }
}
