import { prisma } from "@/lib/db";
import type {
  IngestionPage,
  IngestionJobRecord,
  IngestionResult,
  PlatformPostData,
} from "./types";
import { BATCH_SIZE, RATE_LIMIT_BACKOFF_MS } from "./types";

// ── Pinterest API v5 helpers ────────────────────────────────────────────

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(`Rate limited. Retry after ${retryAfterMs}ms`);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

async function fetchPinterestPins(
  accessToken: string,
  bookmark: string | null,
): Promise<{ posts: PlatformPostData[]; nextCursor: string | null; hasMore: boolean }> {
  let url = `${PINTEREST_API_BASE}/pins?page_size=${BATCH_SIZE}`;

  if (bookmark) {
    url += `&bookmark=${encodeURIComponent(bookmark)}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : RATE_LIMIT_BACKOFF_MS;
    throw new RateLimitError(waitMs);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Pinterest API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const items: Record<string, unknown>[] = data.items ?? [];
  const nextCursor: string | null = data.bookmark ?? null;
  const hasMore = !!nextCursor;

  const posts: PlatformPostData[] = items.map((raw) => {
    const media = raw.media as Record<string, unknown> | undefined;
    const images = media?.images as Record<string, Record<string, unknown>> | undefined;
    const imageUrl = images?.["600x"]?.url as string ?? images?.originals?.url as string ?? "";

    return {
      platformPostId: raw.id as string,
      platformUrl: (raw.link as string) ?? undefined,
      content: (raw.title as string ?? "") + (raw.description ? `\n${raw.description as string}` : ""),
      mediaUrls: imageUrl ? [imageUrl] : [],
      postType: (raw.media_type as string) ?? "image",
      publishedAt: new Date((raw.created_at as string) ?? new Date().toISOString()),
      impressions: 0,
      reach: 0,
      engagements: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: (raw.save_count as number) ?? 0,
      clicks: 0,
      videoViews: 0,
      rawPlatformData: raw,
    };
  });

  return { posts, nextCursor, hasMore };
}

// ── Main Handler ────────────────────────────────────────────────────────

export async function ingestPinterest(
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
      const batch = await fetchPinterestPins(accessToken, cursor);

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
              saves: post.saves,
              rawPlatformData: post.rawPlatformData as never,
            },
          });

          processedItems++;
          if (!oldestPostDate || post.publishedAt < oldestPostDate) {
            oldestPostDate = post.publishedAt;
          }
        } catch (err) {
          console.error(`[ingestion:pinterest] Failed to upsert pin ${post.platformPostId}:`, err);
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
