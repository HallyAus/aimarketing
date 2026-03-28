import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// ── Queue Definitions ────────────────────────────────────────────────────

export const queues = {
  "campaign:publish": new Queue("campaign:publish", { connection }),
  "campaign:schedule": new Queue("campaign:schedule", { connection }),
  "analytics:sync": new Queue("analytics:sync", { connection }),
  "token:refresh": new Queue("token:refresh", { connection }),
  "token:health-check": new Queue("token:health-check", { connection }),
  "media:process": new Queue("media:process", { connection }),
  "email:send": new Queue("email:send", { connection }),
  "webhook:process": new Queue("webhook:process", { connection }),
} as const;

// ── Worker Factory ────────────────────────────────────────────────────────

export function createWorker(
  queueName: string,
  processor: (job: Job) => Promise<void>,
  concurrency: number = 1
): Worker {
  const worker = new Worker(queueName, processor, {
    connection,
    concurrency,
  });

  worker.on("completed", (job) => {
    console.log(`[${queueName}] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[${queueName}] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

export { connection };
