import { PLAN_LIMITS, type PlanType } from "./constants";
import type { PlanLimitCheck, OrgUsage } from "./types";

const LIMIT_MAP: Record<keyof OrgUsage, keyof (typeof PLAN_LIMITS)["FREE"]> = {
  platformConnections: "maxPlatformConnections",
  postsThisMonth: "maxPostsPerMonth",
  teamMembers: "maxTeamMembers",
};

const UPGRADE_PATH: Record<PlanType, PlanType | undefined> = {
  FREE: "PRO",
  PRO: "AGENCY",
  AGENCY: undefined,
};

export function checkPlanLimit(
  plan: PlanType,
  resource: keyof OrgUsage,
  usage: OrgUsage
): PlanLimitCheck {
  const limits = PLAN_LIMITS[plan];
  const limitKey = LIMIT_MAP[resource];
  const max = limits[limitKey] as number;
  const current = usage[resource];

  if (current < max) {
    return { allowed: true, reason: "" };
  }

  const upgrade = UPGRADE_PATH[plan];
  return {
    allowed: false,
    reason: `You've reached the ${resource} limit for the ${plan} plan.`,
    upgradeRequired: upgrade as "PRO" | "AGENCY" | undefined,
  };
}

export function checkFeatureAccess(
  plan: PlanType,
  feature: "hasApprovalWorkflow" | "hasAiInsights" | "hasWhiteLabel" | "hasApiAccess"
): PlanLimitCheck {
  const limits = PLAN_LIMITS[plan];
  if (limits[feature]) {
    return { allowed: true, reason: "" };
  }

  const upgrade = UPGRADE_PATH[plan];
  return {
    allowed: false,
    reason: `This feature requires a ${upgrade ?? "higher"} plan.`,
    upgradeRequired: upgrade as "PRO" | "AGENCY" | undefined,
  };
}
