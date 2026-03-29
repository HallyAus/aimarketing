import { PostHog } from "posthog-node";

const globalForPosthog = globalThis as unknown as {
  posthogServer: PostHog | undefined;
};

export const posthogServer =
  globalForPosthog.posthogServer ??
  new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "", {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });

if (process.env.NODE_ENV !== "production") globalForPosthog.posthogServer = posthogServer;

export type FeatureFlag =
  | "feature-approval-workflow"
  | "feature-ai-insights"
  | "feature-white-label"
  | "feature-api-access";

export async function isFeatureEnabled(
  flag: FeatureFlag,
  distinctId: string,
  properties?: Record<string, unknown>
): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return false;
  const result = await posthogServer.isFeatureEnabled(flag, distinctId, {
    personProperties: properties as Record<string, string>,
  });
  return result ?? false;
}
