import { createWorker, queues, connection } from "./queues";
import type { Job } from "bullmq";
import { processTokenRefresh } from "./processors/token-refresh";
import { processTokenHealthCheck } from "./processors/token-health-check";
import { processCampaignSchedule } from "./processors/campaign-schedule";
import { processCampaignPublish } from "./processors/campaign-publish";
import { processMediaProcess } from "./processors/media-process";
import { processAnalyticsSync } from "./processors/analytics-sync";

console.log("AdPilot Worker starting...");

// ── Placeholder processors (implemented in later phases) ─────────────────

const placeholderProcessor = async (job: Job) => {
  console.log(`[placeholder] Processing job ${job.id} from ${job.queueName}`, job.data);
};

// ── Start Workers ────────────────────────────────────────────────────────

const workers = [
  createWorker("campaign:publish", processCampaignPublish, 5),
  createWorker("campaign:schedule", processCampaignSchedule, 1),
  createWorker("analytics:sync", processAnalyticsSync, 3),
  createWorker("token:refresh", processTokenRefresh, 2),
  createWorker("token:health-check", processTokenHealthCheck, 2),
  createWorker("media:process", processMediaProcess, 2),
  createWorker("email:send", placeholderProcessor, 3),
  createWorker("webhook:process", placeholderProcessor, 3),
];

// ── Scheduled Jobs (repeatable) ──────────────────────────────────────────

async function setupScheduledJobs() {
  await queues["campaign:schedule"].upsertJobScheduler(
    "campaign-schedule-check",
    { every: 60_000 }, // every minute
    { data: {} }
  );

  await queues["token:refresh"].upsertJobScheduler(
    "token-refresh-check",
    { every: 12 * 60 * 60_000 }, // every 12 hours
    { data: {} }
  );

  await queues["token:health-check"].upsertJobScheduler(
    "token-health-check",
    { every: 6 * 60 * 60_000 }, // every 6 hours
    { data: {} }
  );

  await queues["analytics:sync"].upsertJobScheduler(
    "analytics-sync-active",
    { every: 4 * 60 * 60_000 }, // every 4 hours
    { data: { type: "active" } }
  );

  console.log("Scheduled jobs configured");
}

setupScheduledJobs().catch(console.error);

// ── Graceful shutdown ────────────────────────────────────────────────────

async function shutdown() {
  console.log("Shutting down workers...");
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log(`AdPilot Worker running with ${workers.length} queue consumers`);
