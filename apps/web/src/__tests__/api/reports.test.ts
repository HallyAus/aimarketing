import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    performanceReport: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    analyticsSnapshot: { findMany: vi.fn() },
    post: { count: vi.fn(), findMany: vi.fn() },
    organization: { findUnique: vi.fn() },
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

// ── GET /api/reports/generate ────────────────────────────────────────

describe("GET /api/reports/generate", () => {
  let GET: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/reports/generate/route");
    GET = mod.GET;
  });

  it("lists reports (200)", async () => {
    (prisma.performanceReport.findMany as any).mockResolvedValue([
      { id: "r1", reportType: "WEEKLY", data: {} },
    ]);

    const res = await GET(makeReq("http://localhost:3000/api/reports/generate"), defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
  });
});

// ── POST /api/reports/generate ───────────────────────────────────────

describe("POST /api/reports/generate", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/reports/generate/route");
    POST = mod.POST;
  });

  it("generates a report (201)", async () => {
    (prisma.analyticsSnapshot.findMany as any).mockResolvedValue([]);
    (prisma.post.count as any).mockResolvedValue(5);
    (prisma.performanceReport.create as any).mockResolvedValue({ id: "r1" });

    const res = await POST(
      makeReq("http://localhost:3000/api/reports/generate", {
        method: "POST",
        body: JSON.stringify({
          reportType: "WEEKLY",
          startDate: "2026-03-01",
          endDate: "2026-03-07",
        }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(201);
  });

  it("returns 400 when required fields missing", async () => {
    const res = await POST(
      makeReq("http://localhost:3000/api/reports/generate", {
        method: "POST",
        body: JSON.stringify({ reportType: "WEEKLY" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });
});

// ── GET /api/reports/weekly ──────────────────────────────────────────

describe("GET /api/reports/weekly", () => {
  let GET: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/reports/weekly/route");
    GET = mod.GET;
  });

  it("lists weekly reports (200)", async () => {
    (prisma.performanceReport.findMany as any).mockResolvedValue([
      { id: "r1", reportType: "WEEKLY", startDate: new Date(), endDate: new Date(), data: {} },
    ]);

    const res = await GET(makeReq("http://localhost:3000/api/reports/weekly"), defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.reports).toHaveLength(1);
  });
});

// ── POST /api/reports/weekly ─────────────────────────────────────────

describe("POST /api/reports/weekly", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/reports/weekly/route");
    POST = mod.POST;
  });

  it("generates and stores weekly report (200)", async () => {
    (prisma.organization.findUnique as any).mockResolvedValue({ name: "TestOrg" });
    (prisma.post.count as any).mockResolvedValue(10);
    (prisma.analyticsSnapshot.findMany as any).mockResolvedValue([]);
    (prisma.post.findMany as any).mockResolvedValue([]);
    (prisma.performanceReport.create as any).mockResolvedValue({});

    const res = await POST(
      makeReq("http://localhost:3000/api/reports/weekly", {
        method: "POST",
        body: JSON.stringify({ recipients: ["admin@test.com"] }),
      }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.html).toBeDefined();
    expect(json.period).toBeDefined();
  });

  it("throws on empty recipients", async () => {
    await expect(
      POST(
        makeReq("http://localhost:3000/api/reports/weekly", {
          method: "POST",
          body: JSON.stringify({ recipients: [] }),
        }),
        defaultCtx,
      ),
    ).rejects.toThrow();
  });

  it("throws on invalid email in recipients", async () => {
    await expect(
      POST(
        makeReq("http://localhost:3000/api/reports/weekly", {
          method: "POST",
          body: JSON.stringify({ recipients: ["not-email"] }),
        }),
        defaultCtx,
      ),
    ).rejects.toThrow();
  });
});
