import { prisma } from "@/lib/db";
import type {
  IngestionPage,
  IngestionJobRecord,
  IngestionResult,
  PlatformPostData,
  PlatformMetricData,
} from "./types";
import { BATCH_SIZE, RATE_LIMIT_BACKOFF_MS } from "./types";

// ── Facebook Graph API helpers ──────────────────────────────────────────

const FB_API_VERSION = "v19.0";
const FB_POST_FIELDS = [
  "id",
  "message",
  "created_time",
  "permalink_url",
  "type",
  "full_picture",
  "attachments{media,media_type,url}",
  "shares",
  "insights.metric(post_impressions,post_reach,post_engaged_users,post_clicks,post_video_views)",
  "likes.limit(0).summary(true)",
  "comments.limit(0).summary(true)",
].join(",");

async function fetchFacebookPosts(
  pageId: string,
  accessToken: string,
  cursor: string | null,
): Promise<{ posts: PlatformPostData[]; nextCursor: string | null; hasMore: boolean }> {
  let url = `https://graph.facebook.com/${FB_API_VERSION}/${pageId}/posts?fields=${encodeURIComponent(FB_POST_FIELDS)}&limit=${BATCH_SIZE}&access_token=${encodeURIComponent(accessToken)}`;

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
    throw new Error(`Facebook API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const fbPosts: unknown[] = data.data ?? [];
  const nextCursor: string | null = data.paging?.cursors?.after ?? null;
  const hasMore = !!data.paging?.next;

  const posts: PlatformPostData[] = (fbPosts as Record<string, unknown>[]).map((raw) => {
    const insights = extractInsights(raw);
    const likesCount = (raw.likes as Record<string, unknown>)?.summary
      ? ((raw.likes as Record<string, unknown>).summary as Record<string, number>)?.total_count ?? 0
      : 0;
    const commentsCount = (raw.comments as Record<string, unknown>)?.summary
      ? ((raw.comments as Record<string, unknown>).summary as Record<string, number>)?.total_count ?? 0
      : 0;
    const sharesCount = (raw.shares as Record<string, number>)?.count ?? 0;

    return {
      platformPostId: raw.id as string,
      platformUrl: (raw.permalink_url as string) ?? undefined,
      content: (raw.message as string) ?? undefined,
      mediaUrls: extractMediaUrls(raw),
      postType: (raw.type as string) ?? undefined,
      publishedAt: new Date(raw.created_time as string),
      impressions: insights.impressions,
      reach: insights.reach,
      engagements: insights.engaged_users,
      likes: likesCount,
      comments: commentsCount,
      shares: sharesCount,
      saves: 0,
      clicks: insights.clicks,
      videoViews: insights.video_views,
      rawPlatformData: raw,
    };
  });

  return { posts, nextCursor, hasMore };
}

function extractInsights(raw: Record<string, unknown>): {
  impressions: number;
  reach: number;
  engaged_users: number;
  clicks: number;
  video_views: number;
} {
  const result = { impressions: 0, reach: 0, engaged_users: 0, clicks: 0, video_views: 0 };

  const insightsData = (raw.insights as Record<string, unknown>)?.data;
  if (!Array.isArray(insightsData)) return result;

  for (const metric of insightsData) {
    const m = metric as Record<string, unknown>;
    const name = m.name as string;
    const values = m.values as Array<Record<string, number>> | undefined;
    const value = values?.[0]?.value ?? 0;

    if (name === "post_impressions") result.impressions = value;
    if (name === "post_reach") result.reach = value;
    if (name === "post_engaged_users") result.engaged_users = value;
    if (name === "post_clicks") result.clicks = value;
    if (name === "post_video_views") result.video_views = value;
  }

  return result;
}

function extractMediaUrls(raw: Record<string, unknown>): string[] {
  const urls: string[] = [];
  if (raw.full_picture) urls.push(raw.full_picture as string);

  const attachments = (raw.attachments as Record<string, unknown>)?.data;
  if (Array.isArray(attachments)) {
    for (const att of attachments) {
      const a = att as Record<string, unknown>;
      if (a.url) urls.push(a.url as string);
    }
  }

  return urls;
}

// ── Facebook Page Insights (daily metrics) ──────────────────────────────

async function fetchFacebookPageInsights(
  pageId: string,
  accessToken: string,
): Promise<PlatformMetricData[]> {
  const metrics = [
    "page_fans",
    "page_views_total",
    "page_impressions",
    "page_post_engagements",
    "page_fan_adds",
  ].join(",");

  const since = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60; // last 90 days
  const url = `https://graph.facebook.com/${FB_API_VERSION}/${pageId}/insights?metric=${metrics}&period=day&since=${since}&access_token=${encodeURIComponent(accessToken)}`;

  const response = await fetch(url);

  if (response.status === 429 || response.status === 403) {
    const retryAfter = response.headers.get("Retry-After");
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : RATE_LIMIT_BACKOFF_MS;
    throw new RateLimitError(waitMs);
  }

  if (!response.ok) return [];

  const data = await response.json();
  const insightsData: unknown[] = data.data ?? [];

  // Group by date
  const dateMap = new Map<string, PlatformMetricData>();

  for (const metricGroup of insightsData) {
    const mg = metricGroup as Record<string, unknown>;
    const name = mg.name as string;
    const values = mg.values as Array<Record<string, unknown>> | undefined;

    if (!Array.isArray(values)) continue;

    for (const entry of values) {
      const dateStr = (entry.end_time as string | undefined)?.split("T")[0] ?? "";
      if (!dateStr) continue;
      const existing = dateMap.get(dateStr) ?? {
        metricDate: new Date(dateStr),
        rawPlatformData: {},
      };

      const val = entry.value as number ?? 0;

      if (name === "page_fans") existing.followers = val;
      if (name === "page_fan_adds") existing.followersChange = val;
      if (name === "page_views_total") existing.pageViews = val;
      if (name === "page_impressions") existing.pageImpressions = val;
      if (name === "page_post_engagements") existing.pageEngagement = val;

      (existing.rawPlatformData as Record<string, unknown>)[name] = val;
      dateMap.set(dateStr, existing);
    }
  }

  return Array.from(dateMap.values());
}

// ── Rate Limit Error ────────────────────────────────────────────────────

class RateLimitError extends Error {
  retryAfterMs: number;
  constructor(retryAfterMs: number) {
    super(`Rate limited. Retry after ${retryAfterMs}ms`);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

// ── Main Handler ────────────────────────────────────────────────────────

export async function ingestFacebook(
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
      const batch = await fetchFacebookPosts(page.platformPageId, accessToken, cursor);

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
              clicks: post.clicks,
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
              clicks: post.clicks,
              videoViews: post.videoViews,
              rawPlatformData: post.rawPlatformData as never,
            },
          });

          processedItems++;

          if (!oldestPostDate || post.publishedAt < oldestPostDate) {
            oldestPostDate = post.publishedAt;
          }
        } catch (err) {
          console.error(`[ingestion:facebook] Failed to upsert post ${post.platformPostId}:`, err);
          failedItems++;
        }
      }

      cursor = batch.nextCursor;
      hasMore = batch.hasMore;

      // Update job progress after each batch
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

    // After all posts, fetch page-level insights
    try {
      const metrics = await fetchFacebookPageInsights(page.platformPageId, accessToken);
      for (const metric of metrics) {
        await prisma.historicalMetricSnapshot.upsert({
          where: {
            pageId_metricDate: {
              pageId: page.id,
              metricDate: metric.metricDate,
            },
          },
          update: {
            followers: metric.followers,
            followersChange: metric.followersChange,
            pageViews: metric.pageViews,
            pageImpressions: metric.pageImpressions,
            pageEngagement: metric.pageEngagement,
            rawPlatformData: metric.rawPlatformData as never,
          },
          create: {
            pageId: page.id,
            orgId: page.orgId,
            metricDate: metric.metricDate,
            followers: metric.followers,
            followersChange: metric.followersChange,
            pageViews: metric.pageViews,
            pageImpressions: metric.pageImpressions,
            pageEngagement: metric.pageEngagement,
            rawPlatformData: metric.rawPlatformData as never,
          },
        });
      }
    } catch (err) {
      console.error("[ingestion:facebook] Failed to fetch page insights:", err);
      // Non-critical — posts are the priority
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
