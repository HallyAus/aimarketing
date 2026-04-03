import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock the Redis import used by cache.ts
// ---------------------------------------------------------------------------
const mockRedisClient = {
  get: vi.fn(),
  set: vi.fn(),
  keys: vi.fn(),
  del: vi.fn(),
  ping: vi.fn(),
};

vi.mock("@/lib/redis", () => ({
  redis: mockRedisClient,
}));

// Import AFTER mocks are set up
import { cacheGet, cacheSet, cacheInvalidate, cacheable } from "@/lib/cache";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// cacheGet
// ---------------------------------------------------------------------------
describe("cacheGet", () => {
  it("returns parsed JSON when key exists", async () => {
    mockRedisClient.get.mockResolvedValue(JSON.stringify({ name: "test" }));

    const result = await cacheGet<{ name: string }>("my-key");
    expect(result).toEqual({ name: "test" });
    expect(mockRedisClient.get).toHaveBeenCalledWith("my-key");
  });

  it("returns null when key does not exist", async () => {
    mockRedisClient.get.mockResolvedValue(null);

    const result = await cacheGet("missing-key");
    expect(result).toBeNull();
  });

  it("returns null when Redis throws an error", async () => {
    mockRedisClient.get.mockRejectedValue(new Error("Connection refused"));

    const result = await cacheGet("some-key");
    expect(result).toBeNull();
  });

  it("returns typed data for generic parameter", async () => {
    mockRedisClient.get.mockResolvedValue(JSON.stringify(42));

    const result = await cacheGet<number>("num-key");
    expect(result).toBe(42);
  });

  it("returns null for malformed JSON", async () => {
    mockRedisClient.get.mockResolvedValue("not valid json {{{");

    const result = await cacheGet("bad-json");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// cacheSet
// ---------------------------------------------------------------------------
describe("cacheSet", () => {
  it("serializes and stores value with TTL", async () => {
    mockRedisClient.set.mockResolvedValue("OK");

    await cacheSet("key", { foo: "bar" }, 300);

    expect(mockRedisClient.set).toHaveBeenCalledWith(
      "key",
      JSON.stringify({ foo: "bar" }),
      "EX",
      300,
    );
  });

  it("stores primitive values", async () => {
    mockRedisClient.set.mockResolvedValue("OK");

    await cacheSet("num-key", 42, 60);

    expect(mockRedisClient.set).toHaveBeenCalledWith("num-key", "42", "EX", 60);
  });

  it("silently fails when Redis throws", async () => {
    mockRedisClient.set.mockRejectedValue(new Error("Write failed"));

    // Should not throw
    await expect(cacheSet("key", "val", 60)).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// cacheInvalidate
// ---------------------------------------------------------------------------
describe("cacheInvalidate", () => {
  it("deletes all keys matching the pattern", async () => {
    mockRedisClient.keys.mockResolvedValue(["org:1:a", "org:1:b"]);
    mockRedisClient.del.mockResolvedValue(2);

    await cacheInvalidate("org:1:*");

    expect(mockRedisClient.keys).toHaveBeenCalledWith("org:1:*");
    expect(mockRedisClient.del).toHaveBeenCalledWith("org:1:a", "org:1:b");
  });

  it("does not call del when no keys match", async () => {
    mockRedisClient.keys.mockResolvedValue([]);

    await cacheInvalidate("nonexistent:*");

    expect(mockRedisClient.keys).toHaveBeenCalledWith("nonexistent:*");
    expect(mockRedisClient.del).not.toHaveBeenCalled();
  });

  it("silently fails when Redis throws", async () => {
    mockRedisClient.keys.mockRejectedValue(new Error("Connection lost"));

    await expect(cacheInvalidate("pattern:*")).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// cacheable (cache-aside pattern)
// ---------------------------------------------------------------------------
describe("cacheable", () => {
  it("returns cached value when available", async () => {
    mockRedisClient.get.mockResolvedValue(JSON.stringify({ cached: true }));

    const fetchFn = vi.fn().mockResolvedValue({ cached: false });
    const result = await cacheable("key", 300, fetchFn);

    expect(result).toEqual({ cached: true });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("calls fetchFn and caches when cache misses", async () => {
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.set.mockResolvedValue("OK");

    const fetchFn = vi.fn().mockResolvedValue({ fresh: true });
    const result = await cacheable("key", 300, fetchFn);

    expect(result).toEqual({ fresh: true });
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      "key",
      JSON.stringify({ fresh: true }),
      "EX",
      300,
    );
  });

  it("still returns fresh data even if cacheSet fails", async () => {
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.set.mockRejectedValue(new Error("Write failed"));

    const fetchFn = vi.fn().mockResolvedValue("data");
    const result = await cacheable("key", 60, fetchFn);

    expect(result).toBe("data");
  });
});
