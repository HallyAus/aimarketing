import { prisma } from "../db";

/** Monthly token budgets per subscription tier */
const TIER_TOKEN_BUDGETS: Record<string, number> = {
  FREE: 50_000,
  PRO: 500_000,
  AGENCY: 2_000_000,
};

/**
 * Check if the org has remaining token budget this month.
 */
export async function checkTokenBudget(orgId: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { plan: true },
    });
    if (!org) return { allowed: true };

    const budget = TIER_TOKEN_BUDGETS[org.plan] ?? TIER_TOKEN_BUDGETS.FREE!;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const usage = await prisma.usageRecord.aggregate({
      where: {
        orgId,
        metric: "AI_TOKENS_USED",
        periodStart: { gte: monthStart },
      },
      _sum: { value: true },
    });

    const totalTokens = usage._sum.value ?? 0;

    if (totalTokens >= budget) {
      return {
        allowed: false,
        message: `Monthly AI limit reached (${totalTokens.toLocaleString()}/${budget.toLocaleString()} tokens). Upgrade for more.`,
      };
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

/**
 * Record token usage after an API call.
 */
export async function recordTokenUsage(
  orgId: string,
  feature: string,
  totalTokens: number,
): Promise<void> {
  try {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    await prisma.usageRecord.create({
      data: {
        orgId,
        metric: "AI_TOKENS_USED",
        value: totalTokens,
        periodStart,
        periodEnd,
      },
    });
  } catch {
    // Don't break the app if tracking fails
  }
}
