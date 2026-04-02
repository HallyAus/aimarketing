import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    rssFeed: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    page: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/auth-middleware", () => ({
  withRole: (_role: string, handler: Function) =>
    (req: NextRequest, ctx: unknown) => {
      (req as any).orgId = "org-1";
      (req as any).userId = "user-1";
      (req as any).role = "OWNER";
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

import { prisma } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────

function makeReq(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

const defaultCtx = { params: Promise.resolve({}) };

// ── GET /api/rss ─────────────────────────────────────────────────────

describe("GET /api/rss", () => {
  let GET: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/rss/route");
    GET = mod.GET;
  });

  it("lists RSS feeds (200)", async () => {
    (prisma.rssFeed.findMany as any).mockResolvedValue([
      { id: "f1", url: "https://blog.example.com/rss", name: "Example Blog" },
    ]);

    const res = await GET(makeReq("http://localhost:3000/api/rss"), defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
  });
});

// ── POST /api/rss ────────────────────────────────────────────────────

describe("POST /api/rss", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/rss/route");
    POST = mod.POST;
  });

  it("creates an RSS feed (201)", async () => {
    (prisma.page.findFirst as any).mockResolvedValue({ id: "page-1", orgId: "org-1" });
    (prisma.rssFeed.create as any).mockResolvedValue({
      id: "f1", pageId: "page-1", url: "https://blog.example.com/rss",
    });

    const res = await POST(
      makeReq("http://localhost:3000/api/rss", {
        method: "POST",
        body: JSON.stringify({ pageId: "page-1", url: "https://blog.example.com/rss" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(201);
  });

  it("returns 400 when pageId or url missing", async () => {
    const res = await POST(
      makeReq("http://localhost:3000/api/rss", {
        method: "POST",
        body: JSON.stringify({ pageId: "page-1" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when page not found", async () => {
    (prisma.page.findFirst as any).mockResolvedValue(null);

    const res = await POST(
      makeReq("http://localhost:3000/api/rss", {
        method: "POST",
        body: JSON.stringify({ pageId: "missing", url: "https://example.com/rss" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(404);
  });
});

// ── PATCH /api/rss ───────────────────────────────────────────────────

describe("PATCH /api/rss", () => {
  let PATCH: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/rss/route");
    PATCH = mod.PATCH;
  });

  it("updates an RSS feed (200)", async () => {
    (prisma.rssFeed.findUnique as any).mockResolvedValue({
      id: "f1", page: { orgId: "org-1" },
    });
    (prisma.rssFeed.update as any).mockResolvedValue({ id: "f1", isActive: false });

    const res = await PATCH(
      makeReq("http://localhost:3000/api/rss", {
        method: "PATCH",
        body: JSON.stringify({ feedId: "f1", isActive: false }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(200);
  });

  it("returns 400 when feedId missing", async () => {
    const res = await PATCH(
      makeReq("http://localhost:3000/api/rss", {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when feed not found or wrong org", async () => {
    (prisma.rssFeed.findUnique as any).mockResolvedValue({
      id: "f1", page: { orgId: "other-org" },
    });

    const res = await PATCH(
      makeReq("http://localhost:3000/api/rss", {
        method: "PATCH",
        body: JSON.stringify({ feedId: "f1" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/rss ──────────────────────────────────────────────────

describe("DELETE /api/rss", () => {
  let DELETE: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/rss/route");
    DELETE = mod.DELETE;
  });

  it("deletes an RSS feed (200)", async () => {
    (prisma.rssFeed.findUnique as any).mockResolvedValue({
      id: "f1", page: { orgId: "org-1" },
    });
    (prisma.rssFeed.delete as any).mockResolvedValue({});

    const res = await DELETE(
      makeReq("http://localhost:3000/api/rss?feedId=f1", { method: "DELETE" }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 400 when feedId missing", async () => {
    const res = await DELETE(
      makeReq("http://localhost:3000/api/rss", { method: "DELETE" }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when feed not found", async () => {
    (prisma.rssFeed.findUnique as any).mockResolvedValue(null);

    const res = await DELETE(
      makeReq("http://localhost:3000/api/rss?feedId=missing", { method: "DELETE" }),
      defaultCtx,
    );

    expect(res.status).toBe(404);
  });
});
