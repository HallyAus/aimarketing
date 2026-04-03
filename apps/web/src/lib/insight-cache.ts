import { prisma } from "./db";

type InsightType = "sentiment" | "audience" | "best-times" | "benchmarking" | "trending";

const EXPIRY_DAYS: Record<InsightType, number> = {
  sentiment: 7,
  audience: 7,
  "best-times": 7,
  benchmarking: 7,
  trending: 1, // trending expires faster
};

const REGEN_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function addDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Get cached insight if still fresh. Returns null if missing or expired.
 */
export async function getCachedInsight<T = unknown>(
  pageId: string,
  type: InsightType,
): Promise<{ data: T; generatedAt: Date; expired: boolean } | null> {
  const cached = await prisma.cachedInsight.findUnique({
    where: { pageId_type: { pageId, type } },
  });

  if (!cached) return null;

  const expired = cached.expiresAt < new Date();
  return {
    data: cached.data as T,
    generatedAt: cached.generatedAt,
    expired,
  };
}

/**
 * Save an insight to the cache (upsert).
 */
export async function setCachedInsight(
  pageId: string,
  orgId: string,
  type: InsightType,
  data: unknown,
): Promise<void> {
  const now = new Date();
  const expiresAt = addDays(EXPIRY_DAYS[type]);

  await prisma.cachedInsight.upsert({
    where: { pageId_type: { pageId, type } },
    update: { data: data as any, generatedAt: now, expiresAt },
    create: { pageId, orgId, type, data: data as any, generatedAt: now, expiresAt },
  });
}

/**
 * Check if regeneration is allowed (rate limit: 1 per hour per page+type).
 * Returns true if the user can regenerate.
 */
export async function canRegenerate(
  pageId: string,
  type: InsightType,
): Promise<boolean> {
  const cached = await prisma.cachedInsight.findUnique({
    where: { pageId_type: { pageId, type } },
    select: { generatedAt: true },
  });

  if (!cached) return true;

  return Date.now() - cached.generatedAt.getTime() > REGEN_COOLDOWN_MS;
}
