import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@adpilot/db";
import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

const publishQueue = new Queue("campaign:publish", { connection: redis });

// POST /api/campaigns/[campaignId]/publish — schedule or publish now
export const POST = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { campaignId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const publishNow = body.publishNow === true;

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId: req.orgId },
    include: {
      posts: {
        where: {
          status: { in: ["APPROVED", "SCHEDULED"] },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  if (campaign.posts.length === 0) {
    return NextResponse.json(
      { error: "No approved posts to publish", code: "NO_POSTS", statusCode: 400 },
      { status: 400 }
    );
  }

  const results = [];

  for (const post of campaign.posts) {
    if (publishNow || !post.scheduledAt || post.scheduledAt <= new Date()) {
      // Publish immediately — enqueue to worker
      await publishQueue.add("publish", {
        postId: post.id,
        orgId: req.orgId,
        platform: post.platform,
      });

      await prisma.post.update({
        where: { id: post.id },
        data: { status: "PUBLISHING", version: { increment: 1 } },
      });

      results.push({ postId: post.id, action: "publishing" });
    } else {
      // Schedule for later
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "SCHEDULED", version: { increment: 1 } },
      });

      results.push({ postId: post.id, action: "scheduled", scheduledAt: post.scheduledAt });
    }
  }

  // Update campaign status
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: publishNow ? "ACTIVE" : "SCHEDULED",
      version: { increment: 1 },
    },
  });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: publishNow ? "PUBLISH_CAMPAIGN" : "SCHEDULE_CAMPAIGN",
      entityType: "Campaign",
      entityId: campaignId,
      after: { postCount: results.length },
    },
  });

  return NextResponse.json({ results });
}));
