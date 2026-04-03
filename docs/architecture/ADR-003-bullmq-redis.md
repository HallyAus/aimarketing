# ADR-003: BullMQ for Job Queues

**Date:** 2026-03-15
**Status:** Accepted

## Context

AdPilot requires background job processing for:

- Publishing posts to social platforms at scheduled times
- Syncing analytics data from platform APIs
- Refreshing and health-checking OAuth tokens across all connected accounts
- Processing media uploads (thumbnails, resizing)
- Sending transactional emails
- Ingesting historical data from newly connected pages
- Processing incoming webhooks

These jobs must survive server restarts, support retries with backoff, and run concurrently without overwhelming platform API rate limits.

## Decision

Use **BullMQ** backed by **Redis 7** for all background job processing.

Nine queues are defined in `apps/worker/src/queues.ts`:

| Queue | Purpose |
|---|---|
| `campaign:publish` | Publish posts to social platforms |
| `campaign:schedule` | Auto-schedule campaign posts at optimal times |
| `analytics:sync` | Pull engagement metrics from platform APIs |
| `token:refresh` | Refresh expiring OAuth tokens |
| `token:health-check` | Validate token health across all connections |
| `media:process` | Process uploaded media (resize, thumbnail) |
| `email:send` | Send transactional emails via Resend |
| `webhook:process` | Process incoming platform webhooks |
| `ingestion:process` | Ingest historical posts and metrics |

The worker runs as a separate Node.js process (`apps/worker/`) deployed via Docker Compose on the Proxmox host.

## Consequences

**Benefits:**

- Redis-backed persistence means jobs survive process crashes and restarts.
- Built-in retry with exponential backoff handles transient platform API failures.
- Configurable concurrency per queue prevents overwhelming external APIs.
- Job progress tracking enables real-time UI updates for ingestion jobs.
- Separate worker process means queue processing does not block web request handling.

**Trade-offs:**

- Requires a Redis instance (adds infrastructure complexity).
- Redis `maxmemory-policy: noeviction` is mandatory for BullMQ; cannot use `allkeys-lru`.
- Worker must be deployed separately from the Vercel-hosted web app.

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| **pg-boss** | PostgreSQL-backed; avoids Redis dependency but has lower throughput and no built-in dashboard |
| **Agenda.js** | MongoDB-backed; adding MongoDB just for queues is not justified |
| **Vercel Cron** | Limited to 1-minute granularity, no retry logic, no concurrency control |
| **AWS SQS + Lambda** | Adds cloud vendor lock-in; self-hosted Proxmox deployment is a project requirement |
