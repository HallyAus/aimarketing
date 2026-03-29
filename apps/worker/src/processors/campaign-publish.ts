import type { Job } from "bullmq";
import { prisma } from "@adpilot/db";
import { PlatformClient } from "@adpilot/platform-sdk";
import type { Platform } from "@adpilot/platform-sdk";

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

    // TODO: Call platform-specific publish API
    // This will be fully implemented when each adapter gets a publish() method.
    // For now, log the intent and mark as published (placeholder).
    console.log(`[campaign:publish] Publishing to ${platform}:`, {
      postId,
      content: post.content.substring(0, 100),
      mediaUrls: post.mediaUrls,
      hasToken: !!accessToken,
    });

    // Mark as published
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        // platformPostId will be set when actual publish API returns an ID
        version: { increment: 1 },
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId,
        action: "POST_PUBLISHED",
        entityType: "Post",
        entityId: postId,
        after: { platform, publishedAt: new Date().toISOString() },
      },
    });

    console.log(`[campaign:publish] Published post ${postId} to ${platform}`);
  } catch (error) {
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

    // Re-throw for BullMQ retry logic
    throw error;
  }
}
