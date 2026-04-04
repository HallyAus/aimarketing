/**
 * Tier-based usage limits for ReachPilot.
 *
 * Each organization has a plan (FREE, PRO, AGENCY) stored on the Organization
 * model.  This module defines the hard limits per plan and exposes helpers that
 * API routes use to check whether a request is within quota before executing
 * expensive operations (AI generation, publishing, etc.).
 */

import { prisma } from "./db";

// ---------------------------------------------------------------------------
// Tier definitions
// ---------------------------------------------------------------------------

export type Plan = "FREE" | "PRO" | "AGENCY";

export interface TierLimits {
  /** Maximum AI content generations per calendar month. -1 = unlimited. */
  aiGenerationsPerMonth: number;
  /** Maximum posts published per calendar month. -1 = unlimited. */
  postsPerMonth: number;
  /** Maximum connected social platforms. -1 = unlimited. */
  platforms: number;
  /** Maximum team members (including owner). -1 = unlimited. */
  users: number;
  /** Maximum AI requests per hour (burst protection). -1 = unlimited. */
  aiRequestsPerHour: number;
}

export const TIER_LIMITS: Record<Plan, TierLimits> = {
  FREE: {
    aiGenerationsPerMonth: 20,
    postsPerMonth: 30,
    platforms: 3,
    users: 1,
    aiRequestsPerHour: 10,
  },
  PRO: {
    aiGenerationsPerMonth: 200,
    postsPerMonth: -1, // unlimited
    platforms: 9,
    users: 5,
    aiRequestsPerHour: 60,
  },
  AGENCY: {
    aiGenerationsPerMonth: -1, // unlimited
    postsPerMonth: -1,
    platforms: -1,
    users: -1,
    aiRequestsPerHour: 30, // rate-limited to prevent abuse
  },
};

// ---------------------------------------------------------------------------
// Period helpers
// ---------------------------------------------------------------------------

/** Returns the first and last instants of the current calendar month (UTC). */
export function getCurrentMonthPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { start, end };
}

// ---------------------------------------------------------------------------
// Usage tracking
// ---------------------------------------------------------------------------

/**
 * Increment a usage counter for the given organization and metric.
 *
 * If no UsageRecord exists for the current period it will be created with
 * value = 1.  Otherwise the existing record is atomically incremented.
 */
export async function incrementUsage(
  orgId: string,
  metric: "AI_TOKENS_USED" | "POSTS_PUBLISHED" | "API_CALLS",
  amount = 1,
): Promise<number> {
  const { start, end } = getCurrentMonthPeriod();

  // Upsert: increment if exists, create if not.
  const existing = await prisma.usageRecord.findFirst({
    where: { orgId, metric, periodStart: start, periodEnd: end },
  });

  if (existing) {
    const updated = await prisma.usageRecord.update({
      where: { id: existing.id },
      data: { value: { increment: amount } },
    });
    return updated.value;
  }

  const created = await prisma.usageRecord.create({
    data: { orgId, metric, value: amount, periodStart: start, periodEnd: end },
  });
  return created.value;
}

/**
 * Read the current month's usage for a given metric.
 */
export async function getUsage(
  orgId: string,
  metric: "AI_TOKENS_USED" | "POSTS_PUBLISHED" | "API_CALLS",
): Promise<number> {
  const { start, end } = getCurrentMonthPeriod();
  const record = await prisma.usageRecord.findFirst({
    where: { orgId, metric, periodStart: start, periodEnd: end },
  });
  return record?.value ?? 0;
}

// ---------------------------------------------------------------------------
// Limit enforcement
// ---------------------------------------------------------------------------

export class UsageLimitExceededError extends Error {
  public code = "USAGE_LIMIT_EXCEEDED" as const;
  public statusCode = 429;
  public limit: number;
  public current: number;

  constructor(metric: string, current: number, limit: number) {
    super(`Monthly ${metric} limit reached (${current}/${limit}). Upgrade your plan for higher limits.`);
    this.name = "UsageLimitExceededError";
    this.limit = limit;
    this.current = current;
  }
}

/**
 * Check whether the organization is within its AI generation quota for the
 * current month.  Throws `UsageLimitExceededError` if the limit has been
 * reached.
 *
 * Call this **before** making any Anthropic API call.
 */
export async function enforceAiGenerationLimit(orgId: string): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });

  const plan = (org?.plan ?? "FREE") as Plan;
  const limit = TIER_LIMITS[plan].aiGenerationsPerMonth;

  // -1 means unlimited
  if (limit === -1) return;

  const current = await getUsage(orgId, "AI_TOKENS_USED");
  if (current >= limit) {
    throw new UsageLimitExceededError("AI generation", current, limit);
  }
}

/**
 * Convenience wrapper: enforce the limit, run the callback, then increment
 * usage.  Returns whatever the callback returns.
 */
export async function withAiUsageTracking<T>(
  orgId: string,
  fn: () => Promise<T>,
): Promise<T> {
  await enforceAiGenerationLimit(orgId);
  const result = await fn();
  await incrementUsage(orgId, "AI_TOKENS_USED");
  return result;
}
