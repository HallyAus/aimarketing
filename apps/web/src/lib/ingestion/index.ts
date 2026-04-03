import { prisma } from "@/lib/db";
import type { Platform } from "@/lib/db";
import { decrypt } from "@adpilot/shared";
import type { IngestionPage, IngestionJobRecord, IngestionResult } from "./types";
import { ingestFacebook } from "./facebook";
import { ingestInstagram } from "./instagram";
import { ingestTwitter } from "./twitter";
import { ingestYouTube } from "./youtube";
import { ingestLinkedIn } from "./linkedin";
import { ingestTikTok } from "./tiktok";
import { ingestPinterest } from "./pinterest";

// ── Platform Handler Registry ───────────────────────────────────────────

const handlers: Partial<
  Record<Platform, (page: IngestionPage, job: IngestionJobRecord, accessToken: string) => Promise<IngestionResult>>
> = {
  FACEBOOK: ingestFacebook,
  INSTAGRAM: ingestInstagram,
  TWITTER_X: ingestTwitter,
  YOUTUBE: ingestYouTube,
  LINKEDIN: ingestLinkedIn,
  TIKTOK: ingestTikTok,
  PINTEREST: ingestPinterest,
};

// ── Process a single ingestion job ──────────────────────────────────────

export async function processIngestionJob(jobId: string): Promise<void> {
  const ingestionJob = await prisma.ingestionJob.findUnique({
    where: { id: jobId },
    include: {
      page: true,
    },
  });

  if (!ingestionJob) {
    console.error(`[ingestion] Job ${jobId} not found`);
    return;
  }

  if (ingestionJob.status === "COMPLETED" || ingestionJob.status === "CANCELLED") {
    console.log(`[ingestion] Job ${jobId} already ${ingestionJob.status}`);
    return;
  }

  const page = ingestionJob.page;
  const handler = handlers[page.platform];

  if (!handler) {
    await prisma.ingestionJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: `No ingestion handler for platform: ${page.platform}`,
        completedAt: new Date(),
      },
    });
    console.error(`[ingestion] No handler for platform ${page.platform}`);
    return;
  }

  // Decrypt the page access token
  const masterKey = process.env.MASTER_ENCRYPTION_KEY;
  if (!masterKey) {
    await prisma.ingestionJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: "Missing MASTER_ENCRYPTION_KEY",
        completedAt: new Date(),
      },
    });
    return;
  }

  let accessToken: string;
  try {
    accessToken = decrypt(page.accessToken, masterKey);
  } catch (err) {
    await prisma.ingestionJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: `Failed to decrypt access token: ${err instanceof Error ? err.message : "unknown"}`,
        completedAt: new Date(),
      },
    });
    return;
  }

  // Mark as running
  await prisma.ingestionJob.update({
    where: { id: jobId },
    data: {
      status: "RUNNING",
      startedAt: ingestionJob.startedAt ?? new Date(),
      lastActivityAt: new Date(),
    },
  });

  const ingestionPage: IngestionPage = {
    id: page.id,
    orgId: page.orgId,
    platform: page.platform,
    platformPageId: page.platformPageId,
    accessToken: page.accessToken,
    name: page.name,
    connectionId: page.connectionId,
  };

  const jobRecord: IngestionJobRecord = {
    id: ingestionJob.id,
    pageId: ingestionJob.pageId,
    orgId: ingestionJob.orgId,
    platformCursor: ingestionJob.platformCursor,
    processedItems: ingestionJob.processedItems,
    failedItems: ingestionJob.failedItems,
  };

  try {
    const result = await handler(ingestionPage, jobRecord, accessToken);

    if (result.rateLimited) {
      // Pause and schedule retry
      const retryAfter = new Date(Date.now() + (result.retryAfterMs ?? 60_000));
      await prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: "PAUSED",
          processedItems: result.processedItems,
          failedItems: result.failedItems,
          platformCursor: result.cursor,
          oldestPostDate: result.oldestPostDate,
          rateLimitHits: { increment: 1 },
          nextRetryAfter: retryAfter,
          lastActivityAt: new Date(),
        },
      });
      console.log(`[ingestion] Job ${jobId} paused due to rate limit. Retry after ${retryAfter.toISOString()}`);
    } else {
      // Completed
      await prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          processedItems: result.processedItems,
          failedItems: result.failedItems,
          totalItems: result.processedItems + result.failedItems,
          progress: 100,
          platformCursor: result.cursor,
          oldestPostDate: result.oldestPostDate,
          completedAt: new Date(),
          lastActivityAt: new Date(),
        },
      });
      console.log(
        `[ingestion] Job ${jobId} completed. Processed: ${result.processedItems}, Failed: ${result.failedItems}`,
      );
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await prisma.ingestionJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage,
        completedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });
    console.error(`[ingestion] Job ${jobId} failed:`, err);
  }
}

// ── Create and enqueue an ingestion job ─────────────────────────────────

export async function createIngestionJob(
  pageId: string,
  orgId: string,
  dataTypes: string[] = ["posts", "metrics"],
): Promise<string> {
  // Check for existing active job
  const existingJob = await prisma.ingestionJob.findFirst({
    where: {
      pageId,
      status: { in: ["PENDING", "RUNNING", "PAUSED"] },
    },
  });

  if (existingJob) {
    return existingJob.id;
  }

  const job = await prisma.ingestionJob.create({
    data: {
      pageId,
      orgId,
      dataTypes,
      status: "PENDING",
    },
  });

  return job.id;
}
