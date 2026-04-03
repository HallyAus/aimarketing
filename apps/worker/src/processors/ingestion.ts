import type { Job } from "bullmq";
import { prisma } from "@adpilot/db";
import { decrypt } from "@adpilot/shared";

// ── Ingestion Job Processor ─────────────────────────────────────────────
//
// This processor handles two modes:
// 1. Direct job: { jobId } — process a specific ingestion job
// 2. Sweep: {} — find PENDING/PAUSED jobs ready for processing
//

export async function processIngestion(job: Job): Promise<void> {
  const { jobId } = job.data as { jobId?: string };

  if (jobId) {
    await processSpecificJob(jobId);
    return;
  }

  // Sweep mode: find jobs that need processing
  await sweepIngestionJobs();
}

async function sweepIngestionJobs(): Promise<void> {
  const now = new Date();

  // Find PENDING jobs and PAUSED jobs whose retry window has passed
  const jobs = await prisma.ingestionJob.findMany({
    where: {
      OR: [
        { status: "PENDING" },
        {
          status: "PAUSED",
          nextRetryAfter: { lte: now },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 5, // Process up to 5 jobs per sweep
    select: { id: true },
  });

  if (jobs.length === 0) {
    console.log("[ingestion] No pending jobs found");
    return;
  }

  console.log(`[ingestion] Found ${jobs.length} jobs to process`);

  for (const ingestionJob of jobs) {
    await processSpecificJob(ingestionJob.id);
  }
}

async function processSpecificJob(jobId: string): Promise<void> {
  const ingestionJob = await prisma.ingestionJob.findUnique({
    where: { id: jobId },
    include: {
      page: {
        include: {
          connection: { select: { status: true } },
        },
      },
    },
  });

  if (!ingestionJob) {
    console.error(`[ingestion] Job ${jobId} not found`);
    return;
  }

  if (ingestionJob.status === "COMPLETED" || ingestionJob.status === "CANCELLED") {
    return;
  }

  const page = ingestionJob.page;

  if (page.connection.status !== "ACTIVE") {
    await prisma.ingestionJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: "Platform connection is no longer active",
        completedAt: new Date(),
      },
    });
    return;
  }

  // Decrypt access token
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
  } catch {
    await prisma.ingestionJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: "Failed to decrypt page access token",
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

  console.log(`[ingestion] Processing job ${jobId} for page ${page.name} (${page.platform})`);

  // Dynamically import the platform handler to avoid bundling all platform
  // code in the worker's main chunk. The ingestion lib lives in the web app,
  // but the worker can import it since they share the same monorepo.
  // In a production split deployment this would be extracted to a shared package.
  try {
    // Use a dispatcher approach to call the correct platform handler.
    // The handlers follow the same pattern: paginate, upsert, track progress.
    const result = await dispatchPlatformIngestion(
      page.platform,
      {
        id: page.id,
        orgId: page.orgId,
        platform: page.platform,
        platformPageId: page.platformPageId,
        accessToken: page.accessToken,
        name: page.name,
        connectionId: page.connectionId,
      },
      {
        id: ingestionJob.id,
        pageId: ingestionJob.pageId,
        orgId: ingestionJob.orgId,
        platformCursor: ingestionJob.platformCursor,
        processedItems: ingestionJob.processedItems,
        failedItems: ingestionJob.failedItems,
      },
      accessToken,
    );

    if (result.rateLimited) {
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
      console.log(`[ingestion] Job ${jobId} paused (rate limited). Retry after ${retryAfter.toISOString()}`);
    } else {
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

// ── Platform Dispatcher ─────────────────────────────────────────────────
//
// Calls the platform-specific Graph/REST API to fetch posts and metrics.
// Each platform follows the same contract: paginate, upsert, return result.
//

interface IngestionPage {
  id: string;
  orgId: string;
  platform: string;
  platformPageId: string;
  accessToken: string;
  name: string;
  connectionId: string;
}

interface IngestionJobRecord {
  id: string;
  pageId: string;
  orgId: string;
  platformCursor: string | null;
  processedItems: number;
  failedItems: number;
}

interface IngestionResult {
  processedItems: number;
  failedItems: number;
  cursor: string | null;
  hasMore: boolean;
  oldestPostDate: Date | null;
  rateLimited: boolean;
  retryAfterMs?: number;
}

async function dispatchPlatformIngestion(
  platform: string,
  page: IngestionPage,
  job: IngestionJobRecord,
  accessToken: string,
): Promise<IngestionResult> {
  // Platform handlers are in the web app's lib/ingestion directory.
  // The worker imports them dynamically. In a monorepo this works via
  // TypeScript path aliases or direct relative imports.
  // For now, we delegate to a generic fetch-and-upsert loop that works
  // for all platforms via the shared ingestion library.

  switch (platform) {
    case "FACEBOOK": {
      const { ingestFacebook } = await import("../../apps/web/src/lib/ingestion/facebook");
      return ingestFacebook(page as never, job, accessToken);
    }
    case "INSTAGRAM": {
      const { ingestInstagram } = await import("../../apps/web/src/lib/ingestion/instagram");
      return ingestInstagram(page as never, job, accessToken);
    }
    case "TWITTER_X": {
      const { ingestTwitter } = await import("../../apps/web/src/lib/ingestion/twitter");
      return ingestTwitter(page as never, job, accessToken);
    }
    case "YOUTUBE": {
      const { ingestYouTube } = await import("../../apps/web/src/lib/ingestion/youtube");
      return ingestYouTube(page as never, job, accessToken);
    }
    case "LINKEDIN": {
      const { ingestLinkedIn } = await import("../../apps/web/src/lib/ingestion/linkedin");
      return ingestLinkedIn(page as never, job, accessToken);
    }
    case "TIKTOK": {
      const { ingestTikTok } = await import("../../apps/web/src/lib/ingestion/tiktok");
      return ingestTikTok(page as never, job, accessToken);
    }
    case "PINTEREST": {
      const { ingestPinterest } = await import("../../apps/web/src/lib/ingestion/pinterest");
      return ingestPinterest(page as never, job, accessToken);
    }
    default:
      throw new Error(`Unsupported platform for ingestion: ${platform}`);
  }
}
