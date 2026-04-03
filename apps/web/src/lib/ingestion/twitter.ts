import { prisma } from "@/lib/db";
import type {
  IngestionPage,
  IngestionJobRecord,
  IngestionResult,
  PlatformPostData,
} from "./types";
import { BATCH_SIZE, RATE_LIMIT_BACKOFF_MS } from "./types";

// ── Twitter/X API v2 helpers ────────────────────────────────────────────

const TWITTER_API_BASE = "https://api.twitter.com/2";
const TWEET_FIELDS = "id,text,created_at,public_metrics,attachments,entities";
const TWEET_MAX_RESULTS = Math.min(BATCH_SIZE, 100); // Twitter max is 100

class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(`Rate limited. Retry after ${retryAfterMs}ms`);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

async function fetchTweets(
  userId: string,
  accessToken: string,
  paginationToken: string | null,
): Promise<{ posts: PlatformPostData[]; nextCursor: string | null; hasMore: boolean }> {
  let url = `${TWITTER_API_BASE}/users/${userId}/tweets?tweet.fields=${encodeURIComponent(TWEET_FIELDS)}&max_results=${TWEET_MAX_RESULTS}`;

  if (paginationToken) {
    url += `&pagination_token=${encodeURIComponent(paginationToken)}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 429) {
    const resetHeader = response.headers.get("x-rate-limit-reset");
    const waitMs = resetHeader
      ? Math.max(0, parseInt(resetHeader, 10) * 1000 - Date.now())
      : RATE_LIMIT_BACKOFF_MS;
    throw new RateLimitError(waitMs);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Twitter API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const tweets: Record<string, unknown>[] = data.data ?? [];
  const nextCursor: string | null = data.meta?.next_token ?? null;
  const hasMore = !!nextCursor;

  const posts: PlatformPostData[] = tweets.map((raw) => {
    const metrics = (raw.public_metrics as Record<string, number>) ?? {};

    return {
      platformPostId: raw.id as string,
      platformUrl: `https://x.com/i/status/${raw.id as string}`,
      content: (raw.text as string) ?? undefined,
      mediaUrls: [],
      postType: "tweet",
      publishedAt: new Date(raw.created_at as string),
      impressions: metrics.impression_count ?? 0,
      reach: 0,
      engagements: (metrics.like_count ?? 0) + (metrics.retweet_count ?? 0) + (metrics.reply_count ?? 0),
      likes: metrics.like_count ?? 0,
      comments: metrics.reply_count ?? 0,
      shares: metrics.retweet_count ?? 0,
      saves: metrics.bookmark_count ?? 0,
      clicks: 0,
      videoViews: 0,
      rawPlatformData: raw,
    };
  });

  return { posts, nextCursor, hasMore };
}

// ── Main Handler ────────────────────────────────────────────────────────

export async function ingestTwitter(
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
      const batch = await fetchTweets(page.platformPageId, accessToken, cursor);

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
              engagements: post.engagements,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              saves: post.saves,
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
              engagements: post.engagements,
              likes: post.likes,
              comments: post.comments,
              shares: post.shares,
              saves: post.saves,
              rawPlatformData: post.rawPlatformData as never,
            },
          });

          processedItems++;
          if (!oldestPostDate || post.publishedAt < oldestPostDate) {
            oldestPostDate = post.publishedAt;
          }
        } catch (err) {
          console.error(`[ingestion:twitter] Failed to upsert tweet ${post.platformPostId}:`, err);
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
