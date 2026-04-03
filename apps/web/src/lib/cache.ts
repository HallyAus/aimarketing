/**
 * Redis caching layer with graceful degradation.
 *
 * If Redis is unavailable, all operations silently return null/void
 * so the application continues to work without caching.
 */

type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, expiryMode: string, time: number): Promise<unknown>;
  keys(pattern: string): Promise<string[]>;
  del(...keys: string[]): Promise<number>;
  ping(): Promise<string>;
};

let _redis: RedisClient | null = null;
let _redisFailed = false;

async function getRedis(): Promise<RedisClient | null> {
  if (_redisFailed) return null;
  if (_redis) return _redis;

  try {
    const { redis } = await import("@/lib/redis");
    _redis = redis as unknown as RedisClient;
    return _redis;
  } catch {
    _redisFailed = true;
    return null;
  }
}

/**
 * Read a value from Redis cache. Returns null on miss or error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedis();
    if (!client) return null;

    const raw = await client.get(key);
    if (raw === null) return null;

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Write a value to Redis cache. Silently fails on error.
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  try {
    const client = await getRedis();
    if (!client) return;

    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Silently fail — caching is best-effort
  }
}

/**
 * Delete all keys matching the given pattern. Silently fails on error.
 *
 * WARNING: Uses KEYS command — suitable for low-cardinality patterns only.
 * For production-scale invalidation, consider SCAN or pub/sub.
 */
export async function cacheInvalidate(pattern: string): Promise<void> {
  try {
    const client = await getRedis();
    if (!client) return;

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Cache-aside pattern: return cached value if available,
 * otherwise execute fetchFn, cache the result, and return it.
 */
export async function cacheable<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetchFn();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}
