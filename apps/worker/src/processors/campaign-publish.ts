import type { Job } from "bullmq";
import { prisma } from "@adpilot/db";
import { PlatformClient, publishPost } from "@adpilot/platform-sdk";
import type { Platform, PublishPayload } from "@adpilot/platform-sdk";

export async function processCampaignPublish(job: Job): Promise<void> {
  const { postId, orgId, platform } = job.data as {
    postId: string;
    orgId: string;
    platform: Platform;
  };

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post || post.status !== "PUBLISHING") {
    console.log(`[campaign:publish] Post ${postId} not in PUBLISHING state, skipping`);
    return;
  }

  // Find the active connection for this platform + org
  const connection = await prisma.platformConnection.findFirst({
    where: { orgId, platform, status: "ACTIVE" },
  });

  if (!connection) {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "FAILED",
        errorMessage: `No active ${platform} connection`,
        version: { increment: 1 },
      },
    });
    throw new Error(`No active ${platform} connection for org ${orgId}`);
  }

  try {
    // Get a valid access token (with lazy refresh if needed)
    const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
    const client = new PlatformClient(masterKey);
    const accessToken = await client.getAccessToken(connection.id);

    console.log(`[campaign:publish] Publishing to ${platform}:`, {
      postId,
      content: post.content.substring(0, 100),
      mediaUrls: post.mediaUrls,
    });

    // Build publish payload and call the platform-specific publisher
    const payload: PublishPayload = {
      content: post.content,
      mediaUrls: Array.isArray(post.mediaUrls) ? (post.mediaUrls as string[]) : undefined,
      platform,
      accessToken,
      platformUserId: connection.platformUserId,
    };

    const result = await publishPost(platform, payload);

    if (!result.success) {
      // Non-retryable publish failure — mark post as FAILED
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: "FAILED",
          errorMessage: result.error ?? "Unknown publish error",
          version: { increment: 1 },
        },
      });

      await prisma.auditLog.create({
        data: {
          orgId,
          action: "POST_PUBLISH_FAILED",
          entityType: "Post",
          entityId: postId,
          after: { platform, error: result.error },
        },
      });

      console.error(
        `[campaign:publish] Failed to publish post ${postId} to ${platform}: ${result.error}`
      );
      return;
    }

    // Success — update post with platform post ID and published status
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        platformPostId: result.platformPostId ?? null,
        version: { increment: 1 },
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId,
        action: "POST_PUBLISHED",
        entityType: "Post",
        entityId: postId,
        after: {
          platform,
          publishedAt: new Date().toISOString(),
          platformPostId: result.platformPostId,
          url: result.url,
        },
      },
    });

    console.log(
      `[campaign:publish] Published post ${postId} to ${platform}` +
        (result.url ? ` — ${result.url}` : "")
    );
  } catch (error) {
    // Retryable errors (rate limits, transient failures) bubble up here
    const errorMessage = error instanceof Error ? error.message : String(error);

    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "FAILED",
        errorMessage,
        version: { increment: 1 },
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId,
        action: "POST_PUBLISH_FAILED",
        entityType: "Post",
        entityId: postId,
        after: { platform, error: errorMessage },
      },
    });

    console.error(
      `[campaign:publish] Error publishing post ${postId} to ${platform}: ${errorMessage}`
    );

    // Re-throw for BullMQ retry logic
    throw error;
  }
}
