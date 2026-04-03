import { prisma } from "@/lib/db";
import type {
  IngestionPage,
  IngestionJobRecord,
  IngestionResult,
  PlatformPostData,
} from "./types";
import { BATCH_SIZE, RATE_LIMIT_BACKOFF_MS } from "./types";

// ── LinkedIn API helpers ────────────────────────────────────────────────

const LI_API_BASE = "https://api.linkedin.com/v2";

class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(`Rate limited. Retry after ${retryAfterMs}ms`);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

async function fetchLinkedInPosts(
  authorUrn: string,
  accessToken: string,
  start: number,
): Promise<{ posts: PlatformPostData[]; nextStart: number; hasMore: boolean }> {
  const url = `${LI_API_BASE}/ugcPosts?q=authors&authors=List(${encodeURIComponent(authorUrn)})&count=${BATCH_SIZE}&start=${start}&sortBy=CREATED`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get("Retry-After");
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : RATE_LIMIT_BACKOFF_MS;
    throw new RateLimitError(waitMs);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LinkedIn API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const elements: Record<string, unknown>[] = data.elements ?? [];
  const total: number = data.paging?.total ?? 0;
  const nextStart = start + elements.length;
  const hasMore = nextStart < total;

  const posts: PlatformPostData[] = elements.map((raw) => {
    const specificContent = raw.specificContent as Record<string, unknown> | undefined;
    const shareContent = specificContent?.["com.linkedin.ugc.ShareContent"] as Record<string, unknown> | undefined;
    const shareText = (shareContent?.shareCommentary as Record<string, string>)?.text ?? "";
    const media = shareContent?.media as Array<Record<string, unknown>> | undefined;
    const mediaUrls = media?.map((m) => (m.originalUrl as string) ?? "").filter(Boolean) ?? [];

    return {
      platformPostId: raw.id as string,
      platformUrl: undefined,
      content: shareText || undefined,
      mediaUrls,
      postType: shareContent?.shareMediaCategory as string ?? "NONE",
      publishedAt: new Date((raw.created as Record<string, number>)?.time ?? Date.now()),
      impressions: 0,
      reach: 0,
      engagements: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clicks: 0,
      videoViews: 0,
      rawPlatformData: raw,
    };
  });

  return { posts, nextStart, hasMore };
}

// ── Fetch social actions (likes/comments/shares) for a post ─────────────

async function fetchPostSocialActions(
  postUrn: string,
  accessToken: string,
): Promise<{ likes: number; comments: number }> {
  try {
    const encodedUrn = encodeURIComponent(postUrn);
    const url = `${LI_API_BASE}/socialActions/${encodedUrn}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    if (!response.ok) return { likes: 0, comments: 0 };

    const data = await response.json();
    return {
      likes: (data.likesSummary as Record<string, number>)?.totalLikes ?? 0,
      comments: (data.commentsSummary as Record<string, number>)?.totalFirstLevelComments ?? 0,
    };
  } catch {
    return { likes: 0, comments: 0 };
  }
}

// ── Main Handler ────────────────────────────────────────────────────────

export async function ingestLinkedIn(
  page: IngestionPage,
  job: IngestionJobRecord,
  accessToken: string,
): Promise<IngestionResult> {
  // LinkedIn uses offset-based pagination; store the offset in platformCursor
  let start = job.platformCursor ? parseInt(job.platformCursor, 10) : 0;
  let processedItems = job.processedItems;
  let failedItems = job.failedItems;
  let oldestPostDate: Date | null = null;
  let hasMore = true;

  const authorUrn = `urn:li:person:${page.platformPageId}`;

  try {
    while (hasMore) {
      const batch = await fetchLinkedInPosts(authorUrn, accessToken, start);

      for (const post of batch.posts) {
        try {
          // Enrich with social actions
          const social = await fetchPostSocialActions(post.platformPostId, accessToken);
          post.likes = social.likes;
          post.comments = social.comments;
          post.engagements = social.likes + social.comments;

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
              rawPlatformData: post.rawPlatformData as never,
            },
            create: {
              pageId: page.id,
              orgId: page.orgId,
              platformPostId: post.platformPostId,
              content: post.content,
              mediaUrls: post.mediaUrls,
              postType: post.postType,
              publishedAt: post.publishedAt,
              likes: post.likes,
              comments: post.comments,
              engagements: post.engagements,
              rawPlatformData: post.rawPlatformData as never,
            },
          });

          processedItems++;
          if (!oldestPostDate || post.publishedAt < oldestPostDate) {
            oldestPostDate = post.publishedAt;
          }
        } catch (err) {
          console.error(`[ingestion:linkedin] Failed to upsert post ${post.platformPostId}:`, err);
          failedItems++;
        }
      }

      start = batch.nextStart;
      hasMore = batch.hasMore;

      const total = processedItems + failedItems;
      await prisma.ingestionJob.update({
        where: { id: job.id },
        data: {
          processedItems,
          failedItems,
          platformCursor: String(start),
          oldestPostDate,
          progress: total > 0 ? Math.min((processedItems / Math.max(total, 1)) * 100, 99) : 0,
          lastActivityAt: new Date(),
        },
      });
    }

    return {
      processedItems,
      failedItems,
      cursor: String(start),
      hasMore: false,
      oldestPostDate,
      rateLimited: false,
    };
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        processedItems,
        failedItems,
        cursor: String(start),
        hasMore: true,
        oldestPostDate,
        rateLimited: true,
        retryAfterMs: err.retryAfterMs,
      };
    }
    throw err;
  }
}
