import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    approvalRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    post: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops: any[]) => Promise.all(ops)),
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

// ── GET /api/approvals ───────────────────────────────────────────────

describe("GET /api/approvals", () => {
  let GET: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/approvals/route");
    GET = mod.GET;
  });

  it("lists pending approvals (200)", async () => {
    (prisma.approvalRequest.findMany as any).mockResolvedValue([
      { id: "a1", status: "PENDING", post: { id: "p1", content: "hi" } },
    ]);

    const res = await GET(makeReq("http://localhost:3000/api/approvals"), defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
  });

  it("filters by status parameter", async () => {
    (prisma.approvalRequest.findMany as any).mockResolvedValue([]);

    await GET(makeReq("http://localhost:3000/api/approvals?status=APPROVED"), defaultCtx);

    expect(prisma.approvalRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "APPROVED" }),
      }),
    );
  });

  it("returns all when status=ALL", async () => {
    (prisma.approvalRequest.findMany as any).mockResolvedValue([]);

    await GET(makeReq("http://localhost:3000/api/approvals?status=ALL"), defaultCtx);

    // When ALL, the status filter should not be present
    const callArgs = (prisma.approvalRequest.findMany as any).mock.calls[0][0];
    expect(callArgs.where.status).toBeUndefined();
  });
});

// ── POST /api/approvals ──────────────────────────────────────────────

describe("POST /api/approvals", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/approvals/route");
    POST = mod.POST;
  });

  it("creates an approval request (201)", async () => {
    (prisma.post.findFirst as any).mockResolvedValue({ id: "p1", orgId: "org-1" });
    (prisma.approvalRequest.findUnique as any).mockResolvedValue(null);
    const created = { id: "a1", postId: "p1", status: "PENDING" };
    (prisma.$transaction as any).mockResolvedValue([created, {}]);

    const res = await POST(
      makeReq("http://localhost:3000/api/approvals", {
        method: "POST",
        body: JSON.stringify({ postId: "p1" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(201);
  });

  it("returns 400 when postId missing", async () => {
    const res = await POST(
      makeReq("http://localhost:3000/api/approvals", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when post not found", async () => {
    (prisma.post.findFirst as any).mockResolvedValue(null);

    const res = await POST(
      makeReq("http://localhost:3000/api/approvals", {
        method: "POST",
        body: JSON.stringify({ postId: "missing" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(404);
  });

  it("returns 409 when approval already exists", async () => {
    (prisma.post.findFirst as any).mockResolvedValue({ id: "p1", orgId: "org-1" });
    (prisma.approvalRequest.findUnique as any).mockResolvedValue({ id: "existing" });

    const res = await POST(
      makeReq("http://localhost:3000/api/approvals", {
        method: "POST",
        body: JSON.stringify({ postId: "p1" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(409);
  });
});

// ── PATCH /api/approvals ─────────────────────────────────────────────

describe("PATCH /api/approvals", () => {
  let PATCH: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/approvals/route");
    PATCH = mod.PATCH;
  });

  it("approves an approval request (200)", async () => {
    (prisma.approvalRequest.findUnique as any).mockResolvedValue({
      id: "a1",
      postId: "p1",
      post: { orgId: "org-1" },
    });
    const updated = { id: "a1", status: "APPROVED" };
    (prisma.$transaction as any).mockResolvedValue([updated, {}]);

    const res = await PATCH(
      makeReq("http://localhost:3000/api/approvals", {
        method: "PATCH",
        body: JSON.stringify({ approvalId: "a1", action: "APPROVED" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(200);
  });

  it("rejects with comment (200)", async () => {
    (prisma.approvalRequest.findUnique as any).mockResolvedValue({
      id: "a1",
      postId: "p1",
      post: { orgId: "org-1" },
    });
    const updated = { id: "a1", status: "REJECTED" };
    (prisma.$transaction as any).mockResolvedValue([updated, {}]);

    const res = await PATCH(
      makeReq("http://localhost:3000/api/approvals", {
        method: "PATCH",
        body: JSON.stringify({ approvalId: "a1", action: "REJECTED", comment: "Needs rework" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(200);
  });

  it("returns 400 on invalid action", async () => {
    const res = await PATCH(
      makeReq("http://localhost:3000/api/approvals", {
        method: "PATCH",
        body: JSON.stringify({ approvalId: "a1", action: "INVALID" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });

  it("returns 404 when approval not found", async () => {
    (prisma.approvalRequest.findUnique as any).mockResolvedValue(null);

    const res = await PATCH(
      makeReq("http://localhost:3000/api/approvals", {
        method: "PATCH",
        body: JSON.stringify({ approvalId: "missing", action: "APPROVED" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(404);
  });

  it("returns 404 when approval belongs to different org", async () => {
    (prisma.approvalRequest.findUnique as any).mockResolvedValue({
      id: "a1",
      postId: "p1",
      post: { orgId: "other-org" },
    });

    const res = await PATCH(
      makeReq("http://localhost:3000/api/approvals", {
        method: "PATCH",
        body: JSON.stringify({ approvalId: "a1", action: "APPROVED" }),
      }),
      defaultCtx,
    );

    expect(res.status).toBe(404);
  });
});
