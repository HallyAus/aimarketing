import { prisma } from "@/lib/db";

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  enabledForTiers: string[];
  enabledForOrgs: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Check if a specific feature flag is enabled for an organization.
 * Evaluates: global enabled state, tier match, and per-org overrides.
 */
export async function isFeatureEnabled(
  flagKey: string,
  orgId: string
): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({
    where: { key: flagKey },
  });

  if (!flag) return false;

  // Global kill switch — if not enabled at all, no one gets it
  if (!flag.enabled) return false;

  // Per-org override — explicit access regardless of tier
  if (flag.enabledForOrgs.includes(orgId)) return true;

  // Tier-based access — check if the org's plan matches an enabled tier
  if (flag.enabledForTiers.length > 0) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });
    if (!org) return false;
    return flag.enabledForTiers.includes(org.plan);
  }

  // Flag is globally enabled with no tier restrictions
  return true;
}

/**
 * Get all enabled feature flag keys for an organization.
 */
export async function getEnabledFeatures(orgId: string): Promise<string[]> {
  const [flags, org] = await Promise.all([
    prisma.featureFlag.findMany({ where: { enabled: true } }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    }),
  ]);

  if (!org) return [];

  return flags
    .filter((flag) => {
      // Per-org override
      if (flag.enabledForOrgs.includes(orgId)) return true;
      // Tier-based access
      if (flag.enabledForTiers.length > 0) {
        return flag.enabledForTiers.includes(org.plan);
      }
      // Globally enabled with no tier restrictions
      return true;
    })
    .map((flag) => flag.key);
}

/**
 * Get all feature flags (for admin dashboard).
 */
export async function getAllFlags(): Promise<FeatureFlag[]> {
  return prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
  });
}
