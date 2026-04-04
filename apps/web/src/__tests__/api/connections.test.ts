import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    platformConnection: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("@/lib/auth-middleware", () => ({
  withRole: (_role: string, handler: Function) =>
    (req: NextRequest, ctx: unknown) => {
      (req as any).orgId = "org-1";
      (req as any).userId = "user-1";
      (req as any).role = "OWNER";
      (req as any).nextUrl = new URL(req.url);
      return handler(req, ctx);
    },
  withAuth: (handler: Function) =>
    (req: NextRequest, ctx: unknown) => {
      (req as any).orgId = "org-1";
      (req as any).userId = "user-1";
      (req as any).role = "OWNER";
      (req as any).nextUrl = new URL(req.url);
      return handler(req, ctx);
    },
}));

vi.mock("@/lib/api-handler", () => ({
  withErrorHandler: (handler: Function) => handler,
  ZodValidationError: class ZodValidationError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ZodValidationError";
    }
  },
}));

vi.mock("@reachpilot/shared", () => ({
  decrypt: vi.fn(() => "decrypted-token"),
  encrypt: vi.fn(() => "encrypted-token"),
}));

vi.mock("@/lib/connection-cache", () => ({
  getCachedOrFetch: vi.fn((_id: string, _key: string, _ttl: number, fetcher: Function) => fetcher()),
}));

import { prisma } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────

function makeReq(url: string, init?: Record<string, unknown>) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as never);
}

const defaultCtx = { params: Promise.resolve({}) };

// ── GET /api/connections ─────────────────────────────────────────────

describe("GET /api/connections", () => {
  let GET: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/connections/route");
    GET = mod.GET;
  });

  it("lists active connections (200)", async () => {
    const connections = [
      { id: "c1", platform: "FACEBOOK", platformAccountName: "My Page", status: "ACTIVE", createdAt: new Date() },
    ];
    (prisma.platformConnection.findMany as any).mockResolvedValue(connections);

    const res = await GET(makeReq("http://localhost:3000/api/connections"), defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].platform).toBe("FACEBOOK");
  });

  it("returns empty list when no connections (200)", async () => {
    (prisma.platformConnection.findMany as any).mockResolvedValue([]);

    const res = await GET(makeReq("http://localhost:3000/api/connections"), defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(0);
  });
});

// ── GET /api/platforms/facebook/pages ─────────────────────────────────

describe("GET /api/platforms/facebook/pages", () => {
  let GET: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.MASTER_ENCRYPTION_KEY = "test-key";
    // Mock Graph API fetch
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [
          { id: "pg1", name: "Test Page", access_token: "tok", picture: { data: { url: "https://img.com/1" } } },
        ],
      }),
    }));
    const mod = await import("@/app/api/platforms/facebook/pages/route");
    GET = mod.GET;
  });

  it("returns Facebook pages (200)", async () => {
    (prisma.platformConnection.findFirst as any).mockResolvedValue({
      id: "conn-1",
      orgId: "org-1",
      platform: "FACEBOOK",
      accessToken: "enc-token",
      metadata: {},
    });

    const res = await GET(makeReq("http://localhost:3000/api/platforms/facebook/pages"), defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.pages).toBeDefined();
  });

  it("returns 404 when Facebook not connected", async () => {
    (prisma.platformConnection.findFirst as any).mockResolvedValue(null);

    const res = await GET(makeReq("http://localhost:3000/api/platforms/facebook/pages"), defaultCtx);

    expect(res.status).toBe(404);
  });
});

// ── POST /api/platforms/facebook/pages ────────────────────────────────

describe("POST /api/platforms/facebook/pages", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.MASTER_ENCRYPTION_KEY = "test-key";
    const mod = await import("@/app/api/platforms/facebook/pages/route");
    POST = mod.POST;
  });

  it("saves selected pages (200)", async () => {
    (prisma.platformConnection.findFirst as any).mockResolvedValue({
      id: "conn-1", orgId: "org-1", metadata: {},
    });
    (prisma.platformConnection.update as any).mockResolvedValue({});
    (prisma.auditLog.create as any).mockResolvedValue({});

    const res = await POST(
      makeReq("http://localhost:3000/api/platforms/facebook/pages", {
        method: "POST",
        body: JSON.stringify({
          selectedPages: [{ id: "pg1", name: "Test Page", accessToken: "tok" }],
        }),
      }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 400 when selectedPages missing", async () => {
    const res = await POST(
      makeReq("http://localhost:3000/api/platforms/facebook/pages", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when Facebook not connected", async () => {
    (prisma.platformConnection.findFirst as any).mockResolvedValue(null);

    const res = await POST(
      makeReq("http://localhost:3000/api/platforms/facebook/pages", {
        method: "POST",
        body: JSON.stringify({
          selectedPages: [{ id: "pg1", name: "Page", accessToken: "tok" }],
        }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(404);
  });
});
