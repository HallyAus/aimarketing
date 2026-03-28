export type PlanLimitCheck = {
  allowed: boolean;
  reason: string;
  upgradeRequired?: "PRO" | "AGENCY";
};

export type OrgUsage = {
  platformConnections: number;
  postsThisMonth: number;
  teamMembers: number;
};

export type ApiErrorResponse = {
  error: string;
  code: string;
  statusCode: number;
};
