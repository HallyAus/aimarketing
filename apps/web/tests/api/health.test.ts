import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock dependencies used by the health route
// vi.hoisted() ensures variables are available when vi.mock factories run
// ---------------------------------------------------------------------------
const { mockPrisma, mockRedisClient } = vi.hoisted(() => ({
  mockPrisma: {
    $queryRaw: vi.fn(),
  },
  mockRedisClient: {
    ping: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/redis", () => ({
  redis: mockRedisClient,
}));

// Import the route handler AFTER setting up mocks
import { GET } from "@/app/api/health/route";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Health endpoint
// ---------------------------------------------------------------------------
describe("GET /api/health", () => {
  it("returns 200 with healthy status when all checks pass", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockRedisClient.ping.mockResolvedValue("PONG");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.timestamp).toBeDefined();
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.redis).toBeDefined();
  });

  it("response has correct shape with status, timestamp, and checks", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockRedisClient.ping.mockResolvedValue("PONG");

    const response = await GET();
    const body = await response.json();

    // Top-level fields
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("checks");

    // Check entries have status and latencyMs
    expect(body.checks.database).toHaveProperty("status");
    expect(body.checks.database).toHaveProperty("latencyMs");
    expect(typeof body.checks.database.latencyMs).toBe("number");
    expect(body.checks.redis).toHaveProperty("status");
    expect(body.checks.redis).toHaveProperty("latencyMs");
  });

  it("returns Cache-Control: no-store header", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockRedisClient.ping.mockResolvedValue("PONG");

    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns 503 when database is down", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("DB connection refused"));
    mockRedisClient.ping.mockResolvedValue("PONG");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("down");
    expect(body.checks.database.status).toBe("down");
    expect(body.checks.database.error).toBeDefined();
  });

  it("returns 503/degraded when Redis is down but DB is healthy", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockRedisClient.ping.mockRejectedValue(new Error("Redis unavailable"));

    const response = await GET();
    const body = await response.json();

    // The route marks Redis failure as "degraded"
    expect(response.status).toBe(503);
    expect(body.checks.database.status).toBe("healthy");
    expect(body.checks.redis.status).toBe("degraded");
    expect(body.checks.redis.error).toBeDefined();
  });

  it("returns 503 when both services are down", async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error("DB down"));
    mockRedisClient.ping.mockRejectedValue(new Error("Redis down"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("down");
  });

  it("timestamp is a valid ISO date string", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockRedisClient.ping.mockResolvedValue("PONG");

    const response = await GET();
    const body = await response.json();

    const parsed = new Date(body.timestamp);
    expect(parsed.getTime()).not.toBeNaN();
  });

  it("latencyMs values are non-negative numbers", async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    mockRedisClient.ping.mockResolvedValue("PONG");

    const response = await GET();
    const body = await response.json();

    expect(body.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(body.checks.redis.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
