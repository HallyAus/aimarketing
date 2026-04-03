import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    webhookRule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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
      const nextReq = req as any;
      if (!nextReq.nextUrl) nextReq.nextUrl = new URL(req.url);
      return handler(nextReq, ctx);
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

// ── GET /api/webhooks/rules ──────────────────────────────────────────

describe("GET /api/webhooks/rules", () => {
  let GET: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/webhooks/rules/route");
    GET = mod.GET;
  });

  it("lists webhook rules (200)", async () => {
    (prisma.webhookRule.findMany as any).mockResolvedValue([
      { id: "w1", name: "Auto Reply", trigger: "AUTO_REPLY", action: "SEND_EMAIL" },
    ]);

    const res = await GET(makeReq("http://localhost:3000/api/webhooks/rules"), defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
  });

  it("filters by trigger parameter", async () => {
    (prisma.webhookRule.findMany as any).mockResolvedValue([]);

    await GET(makeReq("http://localhost:3000/api/webhooks/rules?trigger=AUTO_REPLY"), defaultCtx);

    expect(prisma.webhookRule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ trigger: "AUTO_REPLY" }),
      }),
    );
  });
});

// ── POST /api/webhooks/rules ─────────────────────────────────────────

describe("POST /api/webhooks/rules", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/webhooks/rules/route");
    POST = mod.POST;
  });

  it("creates a webhook rule (201)", async () => {
    (prisma.webhookRule.create as any).mockResolvedValue({
      id: "w1", name: "Test Rule", trigger: "POST_PUBLISHED", action: "WEBHOOK_URL",
    });

    const res = await POST(
      makeReq("http://localhost:3000/api/webhooks/rules", {
        method: "POST",
        body: JSON.stringify({
          name: "Test Rule",
          trigger: "POST_PUBLISHED",
          action: "WEBHOOK_URL",
          config: { url: "https://hooks.example.com" },
        }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(201);
  });

  it("returns 400 when required fields missing", async () => {
    const res = await POST(
      makeReq("http://localhost:3000/api/webhooks/rules", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });
});

// ── PATCH /api/webhooks/rules ────────────────────────────────────────

describe("PATCH /api/webhooks/rules", () => {
  let PATCH: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/webhooks/rules/route");
    PATCH = mod.PATCH;
  });

  it("updates a webhook rule (200)", async () => {
    (prisma.webhookRule.findFirst as any).mockResolvedValue({ id: "w1", orgId: "org-1" });
    (prisma.webhookRule.update as any).mockResolvedValue({ id: "w1", isActive: false });

    const res = await PATCH(
      makeReq("http://localhost:3000/api/webhooks/rules", {
        method: "PATCH",
        body: JSON.stringify({ ruleId: "w1", isActive: false }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(200);
  });

  it("returns 400 when ruleId missing", async () => {
    const res = await PATCH(
      makeReq("http://localhost:3000/api/webhooks/rules", {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when rule not found", async () => {
    (prisma.webhookRule.findFirst as any).mockResolvedValue(null);

    const res = await PATCH(
      makeReq("http://localhost:3000/api/webhooks/rules", {
        method: "PATCH",
        body: JSON.stringify({ ruleId: "missing" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/webhooks/rules ───────────────────────────────────────

describe("DELETE /api/webhooks/rules", () => {
  let DELETE: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/webhooks/rules/route");
    DELETE = mod.DELETE;
  });

  it("deletes a webhook rule (200)", async () => {
    (prisma.webhookRule.findFirst as any).mockResolvedValue({ id: "w1", orgId: "org-1" });
    (prisma.webhookRule.delete as any).mockResolvedValue({});

    const res = await DELETE(
      makeReq("http://localhost:3000/api/webhooks/rules?ruleId=w1", { method: "DELETE" }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it("returns 400 when ruleId missing", async () => {
    const res = await DELETE(
      makeReq("http://localhost:3000/api/webhooks/rules", { method: "DELETE" }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when rule not found", async () => {
    (prisma.webhookRule.findFirst as any).mockResolvedValue(null);

    const res = await DELETE(
      makeReq("http://localhost:3000/api/webhooks/rules?ruleId=missing", { method: "DELETE" }),
      defaultCtx,
    );

    expect(res.status).toBe(404);
  });
});
