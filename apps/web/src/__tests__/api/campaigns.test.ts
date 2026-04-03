import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  prisma: {
    campaign: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    organization: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
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
  withAuth: (handler: Function) =>
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

vi.mock("@adpilot/shared", () => ({
  createCampaignSchema: {
    safeParse: vi.fn((data: any) => {
      if (!data.name || !data.objective) {
        return { success: false, error: { issues: [{ message: "Name and objective are required" }] } };
      }
      return { success: true, data };
    }),
  },
  checkPlanLimit: vi.fn(),
  sanitizeHtml: (s: string) => s,
}));

import { prisma } from "@/lib/db";
import { GET, POST } from "@/app/api/campaigns/route";

// ── Helpers ──────────────────────────────────────────────────────────

function makeReq(url: string, init?: Record<string, unknown>) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init as never);
}

const defaultCtx = { params: Promise.resolve({}) };

// ── Tests ────────────────────────────────────────────────────────────

describe("GET /api/campaigns", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns paginated campaigns (200)", async () => {
    const campaigns = [
      { id: "c1", name: "Camp 1", _count: { posts: 2 }, creator: { name: "Dan", email: "d@e.com" } },
    ];
    (prisma.campaign.findMany as any).mockResolvedValue(campaigns);
    (prisma.campaign.count as any).mockResolvedValue(1);

    const res = await GET(makeReq("http://localhost:3000/api/campaigns?page=1&limit=20"), defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.pagination).toMatchObject({ page: 1, limit: 20, total: 1 });
  });

  it("supports pageId filtering", async () => {
    (prisma.campaign.findMany as any).mockResolvedValue([]);
    (prisma.campaign.count as any).mockResolvedValue(0);

    await GET(makeReq("http://localhost:3000/api/campaigns?pageId=page-1"), defaultCtx);

    expect(prisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ posts: { some: { pageId: "page-1" } } }),
      }),
    );
  });

  it("clamps page and limit to valid ranges", async () => {
    (prisma.campaign.findMany as any).mockResolvedValue([]);
    (prisma.campaign.count as any).mockResolvedValue(0);

    await GET(makeReq("http://localhost:3000/api/campaigns?page=-5&limit=999"), defaultCtx);

    expect(prisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 100 }),
    );
  });
});

describe("POST /api/campaigns", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a campaign (201)", async () => {
    const created = { id: "c1", name: "New Camp", objective: "AWARENESS" };
    (prisma.organization.findUnique as any).mockResolvedValue({ id: "org-1", plan: "FREE" });
    (prisma.campaign.create as any).mockResolvedValue(created);
    (prisma.auditLog.create as any).mockResolvedValue({});

    const req = makeReq("http://localhost:3000/api/campaigns", {
      method: "POST",
      body: JSON.stringify({ name: "New Camp", objective: "AWARENESS", targetPlatforms: ["FACEBOOK"] }),
    });

    const res = await POST(req, defaultCtx);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.name).toBe("New Camp");
  });

  it("returns 400 on validation failure", async () => {
    const req = makeReq("http://localhost:3000/api/campaigns", {
      method: "POST",
      body: JSON.stringify({}),
    });

    // The route throws ZodValidationError which withErrorHandler (mocked as passthrough) will propagate
    await expect(POST(req, defaultCtx)).rejects.toThrow();
  });

  it("returns 404 when org not found", async () => {
    (prisma.organization.findUnique as any).mockResolvedValue(null);

    const req = makeReq("http://localhost:3000/api/campaigns", {
      method: "POST",
      body: JSON.stringify({ name: "Camp", objective: "AWARENESS", targetPlatforms: [] }),
    });

    const res = await POST(req, defaultCtx);
    expect(res.status).toBe(404);
  });
});
