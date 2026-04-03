import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Feature flag tests.
 *
 * The feature-flags module queries Prisma directly, so we mock the
 * prisma client to test the evaluation logic without a database.
 */

// ---------------------------------------------------------------------------
// Mock Prisma (vi.hoisted ensures availability in vi.mock factory)
// ---------------------------------------------------------------------------
const mockPrisma = vi.hoisted(() => ({
  featureFlag: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  organization: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

import {
  isFeatureEnabled,
  getEnabledFeatures,
  getAllFlags,
} from "@/lib/feature-flags";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const FLAG_AI_CONTENT = {
  id: "flag_1",
  key: "ai_content_studio",
  name: "AI Content Studio",
  description: "AI-powered content generation",
  enabled: true,
  enabledForTiers: ["PRO", "AGENCY"],
  enabledForOrgs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const FLAG_WEBHOOKS = {
  id: "flag_2",
  key: "webhook_automation",
  name: "Webhook Automation",
  description: "Custom webhook triggers",
  enabled: true,
  enabledForTiers: ["AGENCY"],
  enabledForOrgs: ["org_special"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const FLAG_DISABLED = {
  id: "flag_3",
  key: "beta_feature",
  name: "Beta Feature",
  description: "Globally disabled feature",
  enabled: false,
  enabledForTiers: ["PRO", "AGENCY"],
  enabledForOrgs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const FLAG_NO_TIER_RESTRICTION = {
  id: "flag_4",
  key: "global_feature",
  name: "Global Feature",
  description: "Enabled for all tiers",
  enabled: true,
  enabledForTiers: [],
  enabledForOrgs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const ORG_FREE = { id: "org_free", plan: "FREE" };
const ORG_PRO = { id: "org_pro", plan: "PRO" };
const ORG_AGENCY = { id: "org_agency", plan: "AGENCY" };
const ORG_SPECIAL = { id: "org_special", plan: "FREE" };

// ---------------------------------------------------------------------------
// isFeatureEnabled
// ---------------------------------------------------------------------------
describe("isFeatureEnabled", () => {
  it("returns false when flag does not exist", async () => {
    mockPrisma.featureFlag.findUnique.mockResolvedValue(null);

    const result = await isFeatureEnabled("nonexistent_flag", "org_any");
    expect(result).toBe(false);
  });

  it("returns false when flag is globally disabled", async () => {
    mockPrisma.featureFlag.findUnique.mockResolvedValue(FLAG_DISABLED);

    const result = await isFeatureEnabled("beta_feature", ORG_PRO.id);
    expect(result).toBe(false);
  });

  it("returns true for PRO org when flag enables PRO tier", async () => {
    mockPrisma.featureFlag.findUnique.mockResolvedValue(FLAG_AI_CONTENT);
    mockPrisma.organization.findUnique.mockResolvedValue(ORG_PRO);

    const result = await isFeatureEnabled("ai_content_studio", ORG_PRO.id);
    expect(result).toBe(true);
  });

  it("returns false for FREE org when flag only enables PRO/AGENCY", async () => {
    mockPrisma.featureFlag.findUnique.mockResolvedValue(FLAG_AI_CONTENT);
    mockPrisma.organization.findUnique.mockResolvedValue(ORG_FREE);

    const result = await isFeatureEnabled("ai_content_studio", ORG_FREE.id);
    expect(result).toBe(false);
  });

  it("returns true for AGENCY org when flag enables AGENCY tier", async () => {
    mockPrisma.featureFlag.findUnique.mockResolvedValue(FLAG_WEBHOOKS);
    mockPrisma.organization.findUnique.mockResolvedValue(ORG_AGENCY);

    const result = await isFeatureEnabled("webhook_automation", ORG_AGENCY.id);
    expect(result).toBe(true);
  });

  it("returns true via per-org override even if tier does not match", async () => {
    // org_special has FREE plan but is in the enabledForOrgs list
    mockPrisma.featureFlag.findUnique.mockResolvedValue(FLAG_WEBHOOKS);

    const result = await isFeatureEnabled("webhook_automation", ORG_SPECIAL.id);
    expect(result).toBe(true);
    // Should NOT need to query the org plan because override matches first
    expect(mockPrisma.organization.findUnique).not.toHaveBeenCalled();
  });

  it("returns true for any org when flag has no tier restrictions", async () => {
    mockPrisma.featureFlag.findUnique.mockResolvedValue(FLAG_NO_TIER_RESTRICTION);

    const result = await isFeatureEnabled("global_feature", ORG_FREE.id);
    expect(result).toBe(true);
  });

  it("returns false when org does not exist in database", async () => {
    mockPrisma.featureFlag.findUnique.mockResolvedValue(FLAG_AI_CONTENT);
    mockPrisma.organization.findUnique.mockResolvedValue(null);

    const result = await isFeatureEnabled("ai_content_studio", "org_deleted");
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getEnabledFeatures
// ---------------------------------------------------------------------------
describe("getEnabledFeatures", () => {
  it("returns empty array when org does not exist", async () => {
    mockPrisma.featureFlag.findMany.mockResolvedValue([]);
    mockPrisma.organization.findUnique.mockResolvedValue(null);

    const result = await getEnabledFeatures("org_nonexistent");
    expect(result).toEqual([]);
  });

  it("returns only flags matching the org tier", async () => {
    mockPrisma.featureFlag.findMany.mockResolvedValue([
      FLAG_AI_CONTENT,   // PRO, AGENCY
      FLAG_WEBHOOKS,     // AGENCY only (+ org_special override)
      FLAG_NO_TIER_RESTRICTION, // all tiers
    ]);
    mockPrisma.organization.findUnique.mockResolvedValue(ORG_PRO);

    const result = await getEnabledFeatures(ORG_PRO.id);

    expect(result).toContain("ai_content_studio");
    expect(result).not.toContain("webhook_automation"); // PRO not in AGENCY-only
    expect(result).toContain("global_feature");
  });

  it("includes flags via per-org override", async () => {
    mockPrisma.featureFlag.findMany.mockResolvedValue([FLAG_WEBHOOKS]);
    mockPrisma.organization.findUnique.mockResolvedValue(ORG_SPECIAL);

    const result = await getEnabledFeatures(ORG_SPECIAL.id);

    expect(result).toContain("webhook_automation");
  });

  it("returns all globally-enabled no-tier-restriction flags for FREE orgs", async () => {
    mockPrisma.featureFlag.findMany.mockResolvedValue([FLAG_NO_TIER_RESTRICTION]);
    mockPrisma.organization.findUnique.mockResolvedValue(ORG_FREE);

    const result = await getEnabledFeatures(ORG_FREE.id);
    expect(result).toContain("global_feature");
  });

  it("excludes globally disabled flags", async () => {
    // FLAG_DISABLED has enabled: false, so it should not appear in findMany results
    // (the query filters by { enabled: true })
    mockPrisma.featureFlag.findMany.mockResolvedValue([]); // DB already filters
    mockPrisma.organization.findUnique.mockResolvedValue(ORG_PRO);

    const result = await getEnabledFeatures(ORG_PRO.id);
    expect(result).not.toContain("beta_feature");
  });
});

// ---------------------------------------------------------------------------
// getAllFlags
// ---------------------------------------------------------------------------
describe("getAllFlags", () => {
  it("returns all flags ordered by key", async () => {
    mockPrisma.featureFlag.findMany.mockResolvedValue([
      FLAG_AI_CONTENT,
      FLAG_DISABLED,
      FLAG_NO_TIER_RESTRICTION,
      FLAG_WEBHOOKS,
    ]);

    const result = await getAllFlags();

    expect(result).toHaveLength(4);
    expect(mockPrisma.featureFlag.findMany).toHaveBeenCalledWith({
      orderBy: { key: "asc" },
    });
  });
});
