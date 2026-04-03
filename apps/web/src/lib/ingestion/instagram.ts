import { prisma } from "@/lib/db";
import type {
  IngestionPage,
  IngestionJobRecord,
  IngestionResult,
  PlatformPostData,
} from "./types";
import { BATCH_SIZE, RATE_LIMIT_BACKOFF_MS } from "./types";

// ── Instagram Graph API helpers ─────────────────────────────────────────

const IG_API_VERSION = "v19.0";
const IG_MEDIA_FIELDS = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "thumbnail_url",
  "permalink",
  "timestamp",
  "like_count",
  "comments_count",
  "insights.metric(impressions,reach,saved,video_views,shares)",
].join(",");

class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(`Rate limited. Retry after ${retryAfterMs}ms`);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

async function fetchInstagramMedia(
  accessToken: string,
  cursor: string | null,
): Promise<{ posts: PlatformPostData[]; nextCursor: string | null; hasMore: boolean }> {
  let url = `https://graph.facebook.com/${IG_API_VERSION}/me/media?fields=${encodeURIComponent(IG_MEDIA_FIELDS)}&limit=${BATCH_SIZE}&access_token=${encodeURIComponent(accessToken)}`;

  if (cursor) {
    url += `&after=${encodeURIComponent(cursor)}`;
  }

  const response = await fetch(url);

  if (response.status === 429 || response.status === 403) {
    const retryAfter = response.headers.get("Retry-After");
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : RATE_LIMIT_BACKOFF_MS;
    throw new RateLimitError(waitMs);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Instagram API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const items: Record<string, unknown>[] = data.data ?? [];
  const nextCursor: string | null = data.paging?.cursors?.after ?? null;
  const hasMore = !!data.paging?.next;

  const posts: PlatformPostData[] = items.map((raw) => {
    const insights = extractIgInsights(raw);
    const mediaUrl = (raw.media_url as string) ?? (raw.thumbnail_url as string);

    return {
      platformPostId: raw.id as string,
      platformUrl: (raw.permalink as string) ?? undefined,
      content: (raw.caption as string) ?? undefined,
      mediaUrls: mediaUrl ? [mediaUrl] : [],
      postType: (raw.media_type as string) ?? undefined,
      publishedAt: new Date(raw.timestamp as string),
      impressions: insights.impressions,
      reach: insights.reach,
      engagements: (raw.like_count as number ?? 0) + (raw.comments_count as number ?? 0),
      likes: (raw.like_count as number) ?? 0,
      comments: (raw.comments_count as number) ?? 0,
      shares: insights.shares,
      saves: insights.saved,
      clicks: 0,
      videoViews: insights.video_views,
      rawPlatformData: raw,
    };
  });

  return { posts, nextCursor, hasMore };
}

function extractIgInsights(raw: Record<string, unknown>): {
  impressions: number;
  reach: number;
  saved: number;
  video_views: number;
  shares: number;
} {
  const result = { impressions: 0, reach: 0, saved: 0, video_views: 0, shares: 0 };
  const insightsData = (raw.insights as Record<string, unknown>)?.data;
  if (!Array.isArray(insightsData)) return result;

  for (const metric of insightsData) {
    const m = metric as Record<string, unknown>;
    const name = m.name as string;
    const values = m.values as Array<Record<string, number>> | undefined;
    const value = values?.[0]?.value ?? 0;

    if (name === "impressions") result.impressions = value;
    if (name === "reach") result.reach = value;
    if (name === "saved") result.saved = value;
    if (name === "video_views") result.video_views = value;
    if (name === "shares") result.shares = value;
  }

  return result;
}

// ── Main Handler ────────────────────────────────────────────────────────

export async function ingestInstagram(
  page: IngestionPage,
  job: IngestionJobRecord,
  accessToken: string,
): Promise<IngestionResult> {
  let cursor = job.platformCursor;
  let processedItems = job.processedItems;
  let failedItems = job.failedItems;
  let oldestPostDate: Date | null = null;
  let hasMore = true;

  try {
    while (hasMore) {
      const batch = await fetchInstagramMedia(accessToken, cursor);

      for (const post of batch.posts) {
        try {
          await prisma.historicalPost.upsert({
            where: {
              pageId_platformPostId: {
                pageId: page.id,
                platformPostId: post.platformPostId,
              },
            },
            update: {
              impressions: post.impressions,
              reach: post.reach,
              engagements: post.engagements,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              saves: post.saves,
              videoViews: post.videoViews,
              rawPlatformData: post.rawPlatformData as never,
            },
            create: {
              pageId: page.id,
              orgId: page.orgId,
              platformPostId: post.platformPostId,
              platformUrl: post.platformUrl,
              content: post.content,
              mediaUrls: post.mediaUrls,
              postType: post.postType,
              publishedAt: post.publishedAt,
              impressions: post.impressions,
              reach: post.reach,
              engagements: post.engagements,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              saves: post.saves,
              videoViews: post.videoViews,
              rawPlatformData: post.rawPlatformData as never,
            },
          });

          processedItems++;
          if (!oldestPostDate || post.publishedAt < oldestPostDate) {
            oldestPostDate = post.publishedAt;
          }
        } catch (err) {
          console.error(`[ingestion:instagram] Failed to upsert post ${post.platformPostId}:`, err);
          failedItems++;
        }
      }

      cursor = batch.nextCursor;
      hasMore = batch.hasMore;

      const total = processedItems + failedItems;
      await prisma.ingestionJob.update({
        where: { id: job.id },
        data: {
          processedItems,
          failedItems,
          platformCursor: cursor,
          oldestPostDate,
          progress: total > 0 ? Math.min((processedItems / Math.max(total, 1)) * 100, 99) : 0,
          lastActivityAt: new Date(),
        },
      });
    }

    return {
      processedItems,
      failedItems,
      cursor,
      hasMore: false,
      oldestPostDate,
      rateLimited: false,
    };
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        processedItems,
        failedItems,
        cursor,
        hasMore: true,
        oldestPostDate,
        rateLimited: true,
        retryAfterMs: err.retryAfterMs,
      };
    }
    throw err;
  }
}
