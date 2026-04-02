/**
 * Edge-compatible in-memory rate limiter.
 * Uses a simple sliding window counter stored in a Map.
 * Note: In a multi-instance deployment, use Redis-backed rate limiting instead.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class EdgeRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxPoints: number;
  private durationMs: number;

  constructor(opts: { points: number; duration: number }) {
    this.maxPoints = opts.points;
    this.durationMs = opts.duration * 1000;
  }

  async consume(key: string): Promise<void> {
    maybeCleanup(this);
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.durationMs });
      return;
    }

    if (entry.count >= this.maxPoints) {
      throw new Error("Rate limit exceeded");
    }

    entry.count++;
  }
}

// Periodically clean expired entries (every 60s)
let lastCleanup = Date.now();
function maybeCleanup(limiter: EdgeRateLimiter) {
  const now = Date.now();
  if (now - lastCleanup > 60_000) {
    lastCleanup = now;
    const store = (limiter as any).store as Map<string, RateLimitEntry>;
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }
}

export const authRateLimiter = new EdgeRateLimiter({
  points: 20,
  duration: 60,
});

export const apiRateLimiter = new EdgeRateLimiter({
  points: 100,
  duration: 60,
});
