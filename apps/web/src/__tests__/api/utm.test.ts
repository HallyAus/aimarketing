import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    utmLink: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
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

function makeReq(url: string, init?: Record<string, unknown>) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as never);
}

const defaultCtx = { params: Promise.resolve({}) };

// ── GET /api/utm ─────────────────────────────────────────────────────

describe("GET /api/utm", () => {
  let GET: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/utm/route");
    GET = mod.GET;
  });

  it("returns paginated UTM links (200)", async () => {
    const links = [{ id: "u1", url: "https://example.com?utm_source=fb", source: "fb" }];
    (prisma.utmLink.findMany as any).mockResolvedValue(links);
    (prisma.utmLink.count as any).mockResolvedValue(1);

    const res = await GET(makeReq("http://localhost:3000/api/utm"), defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.pagination.total).toBe(1);
  });
});

// ── POST /api/utm ────────────────────────────────────────────────────

describe("POST /api/utm", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/utm/route");
    POST = mod.POST;
  });

  it("creates a UTM link (201)", async () => {
    (prisma.utmLink.create as any).mockResolvedValue({
      id: "u1",
      url: "https://example.com?utm_source=fb&utm_medium=social&utm_campaign=launch",
      source: "fb",
    });

    const res = await POST(
      makeReq("http://localhost:3000/api/utm", {
        method: "POST",
        body: JSON.stringify({
          url: "https://example.com",
          source: "fb",
          medium: "social",
          campaign: "launch",
        }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(201);
  });

  it("returns 400 when required fields missing", async () => {
    const res = await POST(
      makeReq("http://localhost:3000/api/utm", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });
});

// ── DELETE /api/utm ──────────────────────────────────────────────────

describe("DELETE /api/utm", () => {
  let DELETE: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/utm/route");
    DELETE = mod.DELETE;
  });

  it("deletes a UTM link (200)", async () => {
    (prisma.utmLink.findFirst as any).mockResolvedValue({ id: "u1", orgId: "org-1" });
    (prisma.utmLink.delete as any).mockResolvedValue({});

    const res = await DELETE(
      makeReq("http://localhost:3000/api/utm?linkId=u1", { method: "DELETE" }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 400 when linkId missing", async () => {
    const res = await DELETE(
      makeReq("http://localhost:3000/api/utm", { method: "DELETE" }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when link not found", async () => {
    (prisma.utmLink.findFirst as any).mockResolvedValue(null);

    const res = await DELETE(
      makeReq("http://localhost:3000/api/utm?linkId=missing", { method: "DELETE" }),
      defaultCtx,
    );

    expect(res.status).toBe(404);
  });
});
