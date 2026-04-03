import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * ADMIN ACCESS CONTROL TESTS
 *
 * Tests that admin routes enforce proper role-based access:
 * - Regular users (USER) get 403 on /api/admin/* routes
 * - ADMIN users can access admin routes
 * - Only SUPER_ADMIN can perform impersonation
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  organization: {
    findMany: vi.fn(),
  },
  featureFlag: {
    findMany: vi.fn(),
  },
};

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const REGULAR_USER = {
  id: "user_regular",
  email: "user@example.com",
  systemRole: "USER",
};

const ADMIN_USER = {
  id: "user_admin",
  email: "admin@example.com",
  systemRole: "ADMIN",
};

const SUPER_ADMIN_USER = {
  id: "user_super",
  email: "super@example.com",
  systemRole: "SUPER_ADMIN",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: simulate requireAdmin behavior
// ---------------------------------------------------------------------------
function setupAuthAs(
  user: { id: string; email: string; systemRole: string } | null,
) {
  if (!user) {
    // Unauthenticated
    mockAuth.mockResolvedValue(null);
    mockPrisma.user.findUnique.mockResolvedValue(null);
    return;
  }
  mockAuth.mockResolvedValue({
    user: { id: user.id, email: user.email },
  });
  mockPrisma.user.findUnique.mockResolvedValue(user);
}

// ---------------------------------------------------------------------------
// requireAdmin access control
// ---------------------------------------------------------------------------
describe("Admin route access control via requireAdmin", () => {
  // We test the requireAdmin function directly since it guards all admin routes
  let requireAdmin: typeof import("@/app/admin/components/admin-auth").requireAdmin;

  beforeEach(async () => {
    // Re-import to get fresh module with mocks
    const mod = await import("@/app/admin/components/admin-auth");
    requireAdmin = mod.requireAdmin;
  });

  it("returns 401 when no session exists", async () => {
    setupAuthAs(null);

    const result = await requireAdmin();

    expect(result.error).toBeDefined();
    const body = await result.error!.json();
    expect(result.error!.status).toBe(401);
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("returns 403 for regular USER role", async () => {
    setupAuthAs(REGULAR_USER);

    const result = await requireAdmin();

    expect(result.error).toBeDefined();
    const body = await result.error!.json();
    expect(result.error!.status).toBe(403);
    expect(body.code).toBe("FORBIDDEN");
  });

  it("allows ADMIN users through", async () => {
    setupAuthAs(ADMIN_USER);

    const result = await requireAdmin();

    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
    expect(result.user!.id).toBe(ADMIN_USER.id);
    expect(result.user!.systemRole).toBe("ADMIN");
  });

  it("allows SUPER_ADMIN users through", async () => {
    setupAuthAs(SUPER_ADMIN_USER);

    const result = await requireAdmin();

    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
    expect(result.user!.systemRole).toBe("SUPER_ADMIN");
  });
});

// ---------------------------------------------------------------------------
// Admin API routes - users endpoint
// ---------------------------------------------------------------------------
describe("GET /api/admin/users", () => {
  let adminUsersGET: typeof import("@/app/api/admin/users/route").GET;

  beforeEach(async () => {
    const mod = await import("@/app/api/admin/users/route");
    adminUsersGET = mod.GET;
  });

  it("returns 401 for unauthenticated requests", async () => {
    setupAuthAs(null);

    const req = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await adminUsersGET(req);

    expect(response.status).toBe(401);
  });

  it("returns 403 for regular USER", async () => {
    setupAuthAs(REGULAR_USER);

    const req = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await adminUsersGET(req);

    expect(response.status).toBe(403);
  });

  it("returns user data for ADMIN", async () => {
    setupAuthAs(ADMIN_USER);
    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: "u1",
        email: "test@test.com",
        name: "Test User",
        status: "ACTIVE",
        systemRole: "USER",
        timezone: "UTC",
        lastLoginAt: null,
        loginCount: 0,
        createdAt: new Date(),
        memberships: [],
      },
    ]);
    mockPrisma.user.count.mockResolvedValue(1);

    const req = new NextRequest("http://localhost:3000/api/admin/users");
    const response = await adminUsersGET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveProperty("data");
    expect(body).toHaveProperty("meta");
    expect(body.meta).toHaveProperty("total");
    expect(body.meta).toHaveProperty("page");
    expect(body.meta).toHaveProperty("pageSize");
    expect(body.meta).toHaveProperty("totalPages");
  });
});

// ---------------------------------------------------------------------------
// SUPER_ADMIN-only operations
// ---------------------------------------------------------------------------
describe("SUPER_ADMIN-only operations", () => {
  it.todo(
    "TODO: needs impersonation route implementation - " +
    "ADMIN users get 403 when trying to impersonate"
  );

  it.todo(
    "TODO: needs impersonation route implementation - " +
    "SUPER_ADMIN can impersonate other users"
  );

  it.todo(
    "TODO: needs implementation - " +
    "SUPER_ADMIN can modify system-level settings"
  );

  it.todo(
    "TODO: needs implementation - " +
    "ADMIN cannot escalate their own role to SUPER_ADMIN"
  );
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe("Admin access edge cases", () => {
  it("returns 401 when session exists but user not found in DB", async () => {
    // Session says user exists, but DB lookup fails
    mockAuth.mockResolvedValue({
      user: { id: "deleted_user", email: "gone@example.com" },
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const mod = await import("@/app/admin/components/admin-auth");
    const result = await mod.requireAdmin();

    // Should fail - either 401 or 403 depending on implementation
    expect(result.error).toBeDefined();
    expect([401, 403]).toContain(result.error!.status);
  });
});
