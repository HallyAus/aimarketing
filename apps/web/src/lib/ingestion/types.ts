import type { Platform } from "@/lib/db";

// ── Ingestion Job Data ──────────────────────────────────────────────────

export interface IngestionJobData {
  jobId: string;
  pageId: string;
  orgId: string;
  platform: Platform;
}

// ── Platform Post (normalized from each platform's API) ─────────────────

export interface PlatformPostData {
  platformPostId: string;
  platformUrl?: string;
  content?: string;
  mediaUrls: string[];
  postType?: string;
  publishedAt: Date;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  videoViews: number;
  rawPlatformData: unknown;
}

// ── Platform Metric Snapshot (page-level daily metrics) ─────────────────

export interface PlatformMetricData {
  metricDate: Date;
  followers?: number;
  followersChange?: number;
  pageViews?: number;
  pageImpressions?: number;
  pageReach?: number;
  pageEngagement?: number;
  audienceData?: unknown;
  rawPlatformData: unknown;
}

// ── Pagination State ────────────────────────────────────────────────────

export interface PaginationState {
  cursor: string | null;
  hasMore: boolean;
}

// ── Rate Limit Info ─────────────────────────────────────────────────────

export interface RateLimitInfo {
  isLimited: boolean;
  retryAfterMs: number;
}

// ── Platform Handler Interface ──────────────────────────────────────────

export interface IngestionPage {
  id: string;
  orgId: string;
  platform: Platform;
  platformPageId: string;
  accessToken: string; // encrypted
  name: string;
  connectionId: string;
}

export interface IngestionJobRecord {
  id: string;
  pageId: string;
  orgId: string;
  platformCursor: string | null;
  processedItems: number;
  failedItems: number;
}

export interface IngestionResult {
  processedItems: number;
  failedItems: number;
  cursor: string | null;
  hasMore: boolean;
  oldestPostDate: Date | null;
  rateLimited: boolean;
  retryAfterMs?: number;
}

export type PlatformIngestionHandler = (
  page: IngestionPage,
  job: IngestionJobRecord,
  accessToken: string,
) => Promise<IngestionResult>;

// ── Batch size constants ────────────────────────────────────────────────

export const BATCH_SIZE = 25;
export const MAX_RETRIES = 3;
export const RATE_LIMIT_BACKOFF_MS = 60_000;
