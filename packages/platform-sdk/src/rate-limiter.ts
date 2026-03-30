import { PlatformError } from "./errors";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function parseRetryAfter(headers: Headers): number | null {
  const retryAfter = headers.get("Retry-After");
  if (!retryAfter) return null;

  // Could be seconds (integer) or HTTP-date
  const seconds = Number(retryAfter);
  if (!Number.isNaN(seconds)) {
    return seconds * 1000;
  }

  // Try parsing as HTTP-date
  const date = new Date(retryAfter);
  if (!Number.isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return null;
}

function parseRateLimitHeaders(headers: Headers): {
  remaining: number | null;
  resetMs: number | null;
} {
  const remaining = headers.get("X-RateLimit-Remaining");
  const reset = headers.get("X-RateLimit-Reset");

  return {
    remaining: remaining !== null ? Number(remaining) : null,
    resetMs: reset !== null ? Number(reset) * 1000 - Date.now() : null,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A fetch wrapper that handles 429 rate-limit responses with automatic retry
 * and exponential backoff. Parses standard rate-limit headers.
 */
export async function rateLimitAwareFetch(
  input: string | URL | Request,
  init?: RequestInit,
  platform = "UNKNOWN"
): Promise<Response> {
  let lastError: PlatformError | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(input, init);

    if (response.status !== 429) {
      return response;
    }

    // 429 — determine how long to wait
    const retryAfterMs = parseRetryAfter(response.headers);
    const { resetMs } = parseRateLimitHeaders(response.headers);
    const backoffMs = BASE_DELAY_MS * Math.pow(2, attempt);
    const delayMs = retryAfterMs ?? resetMs ?? backoffMs;

    const body = await response.text();
    lastError = PlatformError.fromResponse(platform, 429, body);

    if (attempt < MAX_RETRIES) {
      await sleep(Math.min(delayMs, 30_000)); // Cap at 30s
    }
  }

  throw lastError!;
}
