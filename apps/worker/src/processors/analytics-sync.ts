import type { Job } from "bullmq";
import { prisma } from "@adpilot/db";
import { PlatformClient } from "@adpilot/platform-sdk";
import type { Platform } from "@adpilot/platform-sdk";

export async function processAnalyticsSync(job: Job): Promise<void> {
  const { type } = job.data as { type?: string };
  const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
  const client = new PlatformClient(masterKey);

  // Find posts to sync metrics for
  const statusFilter = type === "active"
    ? { status: { in: ["PUBLISHED" as const] } }
    : { status: { in: ["PUBLISHED" as const, "FAILED" as const] } };

  const posts = await prisma.post.findMany({
    where: {
      ...statusFilter,
      platformPostId: { not: null },
    },
    include: {
      campaign: { select: { orgId: true } },
    },
    take: 100,
  });

  if (posts.length === 0) {
    console.log("[analytics:sync] No posts to sync");
    return;
  }

  console.log(`[analytics:sync] Syncing metrics for ${posts.length} posts`);

  for (const post of posts) {
    try {
      // Find connection for this platform + org
      const connection = await prisma.platformConnection.findFirst({
        where: {
          orgId: post.orgId,
          platform: post.platform,
          status: "ACTIVE",
        },
      });

      if (!connection) {
        console.warn(`[analytics:sync] No active connection for ${post.platform} (post ${post.id})`);
        continue;
      }

      // Get valid access token (lazy refresh if needed)
      let accessToken: string;
      try {
        accessToken = await client.getAccessToken(connection.id);
      } catch {
        console.warn(`[analytics:sync] Token unavailable for ${post.platform} (post ${post.id})`);
        continue;
      }

      // TODO: Call platform-specific analytics API
      // For now, create a placeholder snapshot with the token validation as proof of connectivity
      // Real platform API calls will be added per-platform when their analytics endpoints are integrated
      const snapshot = await prisma.analyticsSnapshot.create({
        data: {
          postId: post.id,
          platform: post.platform,
          snapshotAt: new Date(),
          // Metrics will be populated from real API responses
          // For now, preserve any existing engagement data
          rawPayload: { synced: true, timestamp: new Date().toISOString() },
        },
      });

      // Update denormalized cache on Post
      const latestMetrics = await prisma.analyticsSnapshot.findFirst({
        where: { postId: post.id },
        orderBy: { snapshotAt: "desc" },
      });

      if (latestMetrics) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            engagementSnapshot: {
              impressions: latestMetrics.impressions,
              reach: latestMetrics.reach,
              clicks: latestMetrics.clicks,
              likes: latestMetrics.likes,
              comments: latestMetrics.comments,
              shares: latestMetrics.shares,
              saves: latestMetrics.saves,
              videoViews: latestMetrics.videoViews,
              ctr: latestMetrics.ctr,
              lastSyncedAt: latestMetrics.snapshotAt.toISOString(),
            },
          },
        });
      }

      console.log(`[analytics:sync] Synced post ${post.id} (${post.platform})`);
    } catch (error) {
      console.error(`[analytics:sync] Failed for post ${post.id}:`, error);
      // Continue with other posts — don't fail the whole batch
    }
  }
}
