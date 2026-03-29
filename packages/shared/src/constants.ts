export const PLAN_LIMITS = {
  FREE: {
    maxOrganizations: 1,
    maxPlatformConnections: 2,
    maxPostsPerMonth: 10,
    maxTeamMembers: 1,
    analyticsRetentionDays: 30,
    hasApprovalWorkflow: false,
    hasAiInsights: false,
    hasWhiteLabel: false,
    hasApiAccess: false,
    maxUploadSizeBytes: 50 * 1024 * 1024,
  },
  PRO: {
    maxOrganizations: 1,
    maxPlatformConnections: 5,
    maxPostsPerMonth: Infinity,
    maxTeamMembers: 5,
    analyticsRetentionDays: 365,
    hasApprovalWorkflow: true,
    hasAiInsights: false,
    hasWhiteLabel: false,
    hasApiAccess: false,
    maxUploadSizeBytes: 200 * 1024 * 1024,
  },
  AGENCY: {
    maxOrganizations: Infinity,
    maxPlatformConnections: Infinity,
    maxPostsPerMonth: Infinity,
    maxTeamMembers: Infinity,
    analyticsRetentionDays: Infinity,
    hasApprovalWorkflow: true,
    hasAiInsights: true,
    hasWhiteLabel: true,
    hasApiAccess: true,
    maxUploadSizeBytes: 500 * 1024 * 1024,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export const ROLE_HIERARCHY: Record<string, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const STRIPE_PLAN_PRICE_IDS: Record<string, string> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID ?? "",
  AGENCY: process.env.STRIPE_AGENCY_PRICE_ID ?? "",
};

/** Valid post status transitions */
export const POST_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING_APPROVAL", "SCHEDULED", "DELETED"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["SCHEDULED"],
  REJECTED: ["DRAFT", "DELETED"],
  SCHEDULED: ["PUBLISHING", "DRAFT"],
  PUBLISHING: ["PUBLISHED", "FAILED"],
  PUBLISHED: ["DELETED"],
  FAILED: ["SCHEDULED", "DRAFT", "DELETED"],
  DELETED: [],
};

export function isValidTransition(from: string, to: string): boolean {
  return POST_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
