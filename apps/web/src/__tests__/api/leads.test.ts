import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    leadCapture: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organization: { findFirst: vi.fn() },
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

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { currentOrgId: "org-1" } }),
}));

import { prisma } from "@/lib/db";

// ── Helpers ──────────────────────────────────────────────────────────

function makeReq(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

const defaultCtx = { params: Promise.resolve({}) };

// ── GET /api/leads ───────────────────────────────────────────────────

describe("GET /api/leads", () => {
  let GET: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/leads/route");
    GET = mod.GET;
  });

  it("lists leads (200)", async () => {
    const leads = [{ id: "l1", name: "John", email: "john@test.com" }];
    (prisma.leadCapture.findMany as any).mockResolvedValue(leads);
    (prisma.leadCapture.count as any).mockResolvedValue(1);

    const res = await GET(makeReq("http://localhost:3000/api/leads"), defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.leads).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("supports search parameter", async () => {
    (prisma.leadCapture.findMany as any).mockResolvedValue([]);
    (prisma.leadCapture.count as any).mockResolvedValue(0);

    await GET(makeReq("http://localhost:3000/api/leads?search=john"), defaultCtx);

    expect(prisma.leadCapture.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: expect.objectContaining({ contains: "john" }) }),
          ]),
        }),
      }),
    );
  });
});

// ── POST /api/leads ──────────────────────────────────────────────────

describe("POST /api/leads", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/leads/route");
    POST = mod.POST;
  });

  it("creates a lead (201)", async () => {
    (prisma.leadCapture.create as any).mockResolvedValue({
      id: "l1", name: "Jane", email: "jane@test.com",
    });

    const res = await POST(
      makeReq("http://localhost:3000/api/leads", {
        method: "POST",
        body: JSON.stringify({ name: "Jane", email: "jane@test.com" }),
      }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.lead.name).toBe("Jane");
  });

  it("throws on invalid email", async () => {
    await expect(
      POST(
        makeReq("http://localhost:3000/api/leads", {
          method: "POST",
          body: JSON.stringify({ name: "Jane", email: "not-email" }),
        }),
        defaultCtx,
      ),
    ).rejects.toThrow();
  });

  it("throws on missing name", async () => {
    await expect(
      POST(
        makeReq("http://localhost:3000/api/leads", {
          method: "POST",
          body: JSON.stringify({ email: "jane@test.com" }),
        }),
        defaultCtx,
      ),
    ).rejects.toThrow();
  });
});

// ── PATCH /api/leads ─────────────────────────────────────────────────

describe("PATCH /api/leads", () => {
  let PATCH: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/leads/route");
    PATCH = mod.PATCH;
  });

  it("updates a lead (200)", async () => {
    (prisma.leadCapture.findFirst as any).mockResolvedValue({ id: "l1", orgId: "org-1" });
    (prisma.leadCapture.update as any).mockResolvedValue({ id: "l1", name: "Updated" });

    const res = await PATCH(
      makeReq("http://localhost:3000/api/leads", {
        method: "PATCH",
        body: JSON.stringify({ id: "l1", name: "Updated" }),
      }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.lead.name).toBe("Updated");
  });

  it("returns 404 when lead not found", async () => {
    (prisma.leadCapture.findFirst as any).mockResolvedValue(null);

    const res = await PATCH(
      makeReq("http://localhost:3000/api/leads", {
        method: "PATCH",
        body: JSON.stringify({ id: "missing", name: "x" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/leads ────────────────────────────────────────────────

describe("DELETE /api/leads", () => {
  let DELETE: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/leads/route");
    DELETE = mod.DELETE;
  });

  it("deletes a lead (200)", async () => {
    (prisma.leadCapture.findFirst as any).mockResolvedValue({ id: "l1", orgId: "org-1" });
    (prisma.leadCapture.delete as any).mockResolvedValue({});

    const res = await DELETE(
      makeReq("http://localhost:3000/api/leads?id=l1", { method: "DELETE" }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 404 when lead not found", async () => {
    (prisma.leadCapture.findFirst as any).mockResolvedValue(null);

    const res = await DELETE(
      makeReq("http://localhost:3000/api/leads?id=missing", { method: "DELETE" }),
      defaultCtx,
    );

    expect(res.status).toBe(404);
  });

  it("throws when id param missing", async () => {
    await expect(
      DELETE(makeReq("http://localhost:3000/api/leads", { method: "DELETE" }), defaultCtx),
    ).rejects.toThrow();
  });
});
