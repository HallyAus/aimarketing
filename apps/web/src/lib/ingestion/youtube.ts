import { prisma } from "@/lib/db";
import type {
  IngestionPage,
  IngestionJobRecord,
  IngestionResult,
  PlatformPostData,
} from "./types";
import { BATCH_SIZE, RATE_LIMIT_BACKOFF_MS } from "./types";

// ── YouTube Data API v3 helpers ─────────────────────────────────────────

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(`Rate limited. Retry after ${retryAfterMs}ms`);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

async function fetchYouTubeVideos(
  channelId: string,
  accessToken: string,
  pageToken: string | null,
): Promise<{ posts: PlatformPostData[]; nextCursor: string | null; hasMore: boolean }> {
  // Step 1: Search for videos from the channel
  let searchUrl = `${YT_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${BATCH_SIZE}&access_token=${encodeURIComponent(accessToken)}`;

  if (pageToken) {
    searchUrl += `&pageToken=${encodeURIComponent(pageToken)}`;
  }

  const searchRes = await fetch(searchUrl);

  if (searchRes.status === 429 || searchRes.status === 403) {
    throw new RateLimitError(RATE_LIMIT_BACKOFF_MS);
  }

  if (!searchRes.ok) {
    const errorBody = await searchRes.text();
    throw new Error(`YouTube Search API error ${searchRes.status}: ${errorBody}`);
  }

  const searchData = await searchRes.json();
  const items: Record<string, unknown>[] = searchData.items ?? [];
  const nextCursor: string | null = searchData.nextPageToken ?? null;
  const hasMore = !!nextCursor;

  if (items.length === 0) {
    return { posts: [], nextCursor: null, hasMore: false };
  }

  // Step 2: Get video statistics
  const videoIds = items.map((item: Record<string, unknown>) => {
    const id = item.id as Record<string, string>;
    return id.videoId;
  }).join(",");

  const statsUrl = `${YT_API_BASE}/videos?part=statistics,snippet,contentDetails&id=${videoIds}&access_token=${encodeURIComponent(accessToken)}`;

  const statsRes = await fetch(statsUrl);

  if (statsRes.status === 429 || statsRes.status === 403) {
    throw new RateLimitError(RATE_LIMIT_BACKOFF_MS);
  }

  if (!statsRes.ok) {
    const errorBody = await statsRes.text();
    throw new Error(`YouTube Videos API error ${statsRes.status}: ${errorBody}`);
  }

  const statsData = await statsRes.json();
  const videoItems: Record<string, unknown>[] = statsData.items ?? [];

  const posts: PlatformPostData[] = videoItems.map((raw) => {
    const snippet = (raw.snippet as Record<string, unknown>) ?? {};
    const stats = (raw.statistics as Record<string, string>) ?? {};
    const videoId = raw.id as string;

    return {
      platformPostId: videoId,
      platformUrl: `https://www.youtube.com/watch?v=${videoId}`,
      content: (snippet.title as string) ?? undefined,
      mediaUrls: snippet.thumbnails
        ? [((snippet.thumbnails as Record<string, Record<string, string>>).high?.url) ?? ""]
        : [],
      postType: "video",
      publishedAt: new Date(snippet.publishedAt as string),
      impressions: 0,
      reach: 0,
      engagements: parseInt(stats.likeCount ?? "0", 10) + parseInt(stats.commentCount ?? "0", 10),
      likes: parseInt(stats.likeCount ?? "0", 10),
      comments: parseInt(stats.commentCount ?? "0", 10),
      shares: 0,
      saves: parseInt(stats.favoriteCount ?? "0", 10),
      clicks: 0,
      videoViews: parseInt(stats.viewCount ?? "0", 10),
      rawPlatformData: raw,
    };
  });

  return { posts, nextCursor, hasMore };
}

// ── Main Handler ────────────────────────────────────────────────────────

export async function ingestYouTube(
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
      const batch = await fetchYouTubeVideos(page.platformPageId, accessToken, cursor);

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
              likes: post.likes,
              comments: post.comments,
              engagements: post.engagements,
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
              engagements: post.engagements,
              likes: post.likes,
              comments: post.comments,
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
          console.error(`[ingestion:youtube] Failed to upsert video ${post.platformPostId}:`, err);
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
