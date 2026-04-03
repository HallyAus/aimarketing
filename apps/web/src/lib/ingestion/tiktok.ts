import { prisma } from "@/lib/db";
import type {
  IngestionPage,
  IngestionJobRecord,
  IngestionResult,
  PlatformPostData,
} from "./types";
import { BATCH_SIZE, RATE_LIMIT_BACKOFF_MS } from "./types";

// ── TikTok API helpers ──────────────────────────────────────────────────

const TT_API_BASE = "https://open.tiktokapis.com/v2";

class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(`Rate limited. Retry after ${retryAfterMs}ms`);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

async function fetchTikTokVideos(
  accessToken: string,
  cursor: number | null,
): Promise<{ posts: PlatformPostData[]; nextCursor: number | null; hasMore: boolean }> {
  const body: Record<string, unknown> = {
    max_count: BATCH_SIZE,
  };
  if (cursor !== null) {
    body.cursor = cursor;
  }

  const response = await fetch(`${TT_API_BASE}/video/list/?fields=id,title,create_time,share_url,cover_image_url,like_count,comment_count,share_count,view_count,duration`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : RATE_LIMIT_BACKOFF_MS;
    throw new RateLimitError(waitMs);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`TikTok API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const videos: Record<string, unknown>[] = data.data?.videos ?? [];
  const nextCursor: number | null = data.data?.has_more ? (data.data.cursor as number) : null;
  const hasMore = !!data.data?.has_more;

  const posts: PlatformPostData[] = videos.map((raw) => ({
    platformPostId: raw.id as string,
    platformUrl: (raw.share_url as string) ?? undefined,
    content: (raw.title as string) ?? undefined,
    mediaUrls: raw.cover_image_url ? [raw.cover_image_url as string] : [],
    postType: "video",
    publishedAt: new Date((raw.create_time as number) * 1000),
    impressions: 0,
    reach: 0,
    engagements: (raw.like_count as number ?? 0) + (raw.comment_count as number ?? 0) + (raw.share_count as number ?? 0),
    likes: (raw.like_count as number) ?? 0,
    comments: (raw.comment_count as number) ?? 0,
    shares: (raw.share_count as number) ?? 0,
    saves: 0,
    clicks: 0,
    videoViews: (raw.view_count as number) ?? 0,
    rawPlatformData: raw,
  }));

  return { posts, nextCursor, hasMore };
}

// ── Main Handler ────────────────────────────────────────────────────────

export async function ingestTikTok(
  page: IngestionPage,
  job: IngestionJobRecord,
  accessToken: string,
): Promise<IngestionResult> {
  let cursor: number | null = job.platformCursor ? parseInt(job.platformCursor, 10) : null;
  let processedItems = job.processedItems;
  let failedItems = job.failedItems;
  let oldestPostDate: Date | null = null;
  let hasMore = true;

  try {
    while (hasMore) {
      const batch = await fetchTikTokVideos(accessToken, cursor);

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
              engagements: post.engagements,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
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
              engagements: post.engagements,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              videoViews: post.videoViews,
              rawPlatformData: post.rawPlatformData as never,
            },
          });

          processedItems++;
          if (!oldestPostDate || post.publishedAt < oldestPostDate) {
            oldestPostDate = post.publishedAt;
          }
        } catch (err) {
          console.error(`[ingestion:tiktok] Failed to upsert video ${post.platformPostId}:`, err);
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
          platformCursor: cursor !== null ? String(cursor) : null,
          oldestPostDate,
          progress: total > 0 ? Math.min((processedItems / Math.max(total, 1)) * 100, 99) : 0,
          lastActivityAt: new Date(),
        },
      });
    }

    return {
      processedItems,
      failedItems,
      cursor: cursor !== null ? String(cursor) : null,
      hasMore: false,
      oldestPostDate,
      rateLimited: false,
    };
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        processedItems,
        failedItems,
        cursor: cursor !== null ? String(cursor) : null,
        hasMore: true,
        oldestPostDate,
        rateLimited: true,
        retryAfterMs: err.retryAfterMs,
      };
    }
    throw err;
  }
}
