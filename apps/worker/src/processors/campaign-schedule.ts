import type { Job } from "bullmq";
import { Queue } from "bullmq";
import { prisma } from "@adpilot/db";
import { connection } from "../queues";

const publishQueue = new Queue("campaign:publish", { connection });

export async function processCampaignSchedule(job: Job): Promise<void> {
  // Find posts that are SCHEDULED and due for publishing
  const duePosts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: new Date() },
    },
    take: 50, // Process in batches
  });

  if (duePosts.length === 0) return;

  console.log(`[campaign:schedule] Found ${duePosts.length} posts due for publishing`);

  for (const post of duePosts) {
    // Transition to PUBLISHING
    await prisma.post.update({
      where: { id: post.id },
      data: { status: "PUBLISHING", version: { increment: 1 } },
    });

    // Enqueue for actual publishing
    await publishQueue.add(
      "publish",
      {
        postId: post.id,
        orgId: post.orgId,
        platform: post.platform,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 30_000, // 30s, 2min, 10min
        },
      }
    );
  }
}
