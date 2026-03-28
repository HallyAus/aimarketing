import { createWorker, queues, connection } from "./queues";
import type { Job } from "bullmq";

console.log("AdPilot Worker starting...");

// ── Placeholder processors (implemented in later phases) ─────────────────

const placeholderProcessor = async (job: Job) => {
  console.log(`[placeholder] Processing job ${job.id} from ${job.queueName}`, job.data);
};

// ── Start Workers ────────────────────────────────────────────────────────

const workers = [
  createWorker("campaign:publish", placeholderProcessor, 5),
  createWorker("campaign:schedule", placeholderProcessor, 1),
  createWorker("analytics:sync", placeholderProcessor, 3),
  createWorker("token:refresh", placeholderProcessor, 2),
  createWorker("token:health-check", placeholderProcessor, 2),
  createWorker("media:process", placeholderProcessor, 2),
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
