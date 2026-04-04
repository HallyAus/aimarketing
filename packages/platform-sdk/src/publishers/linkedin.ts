import { rateLimitAwareFetch } from "../rate-limiter";
import { PlatformError } from "../errors";
import type { PublishPayload, PublishResult } from "./index";

const LINKEDIN_API_BASE = "https://api.linkedin.com";

interface LinkedInApiError {
  message?: string;
  status?: number;
  serviceErrorCode?: number;
}

interface PostResponse {
  id?: string;
  "x-restli-id"?: string;
}

function classifyLinkedInError(
  status: number,
  body: LinkedInApiError
): { message: string; retryable: boolean } {
  if (status === 401) {
    return {
      message: `Authentication failed: ${body.message ?? "Invalid or expired token"}`,
      retryable: false,
    };
  }

  if (status === 403) {
    return {
      message: `Permission denied: ${body.message ?? "Insufficient permissions"}`,
      retryable: false,
    };
  }

  if (status === 429) {
    return {
      message: "Rate limited by LinkedIn API",
      retryable: true,
    };
  }

  return {
    message: body.message ?? "LinkedIn API error",
    retryable: status >= 500,
  };
}

/**
 * Build a LinkedIn Posts API body.
 *
 * Uses the v2 Posts API (replaces deprecated UGC Posts API).
 * For text-only: commentary only.
 * For image posts: uses ARTICLE distribution with thumbnail URLs.
 */
function buildPostBody(
  authorUrn: string,
  content: string,
  mediaUrls?: string[]
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    author: authorUrn,
    commentary: content,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
  };

  if (mediaUrls && mediaUrls.length > 0) {
    body.content = {
      article: {
        source: mediaUrls[0],
        title: content.substring(0, 200),
        description: content.substring(0, 200),
      },
    };
  }

  return body;
}

/**
 * Publish a post to LinkedIn using the Posts API.
 *
 * The platformUserId should be the LinkedIn member sub (from userinfo).
 */
export async function publishToLinkedin(
  payload: PublishPayload
): Promise<PublishResult> {
  const { content, mediaUrls, accessToken, platformUserId } = payload;

  try {
    const authorUrn = platformUserId.startsWith("urn:")
      ? platformUserId
      : `urn:li:person:${platformUserId}`;

    const body = buildPostBody(authorUrn, content, mediaUrls);

    const response = await rateLimitAwareFetch(
      `${LINKEDIN_API_BASE}/rest/posts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "LinkedIn-Version": "202401",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(body),
      },
      "LINKEDIN"
    );

    if (!response.ok) {
      const responseBody = (await response.json()) as LinkedInApiError;
      const { message, retryable } = classifyLinkedInError(
        response.status,
        responseBody
      );
      if (retryable) {
        throw PlatformError.fromResponse("LINKEDIN", response.status, message);
      }
      return { success: false, error: message };
    }

    // Posts API returns the post URN in the x-restli-id header
    const postUrn =
      response.headers.get("x-restli-id") ??
      ((await response.json().catch(() => ({}))) as PostResponse).id;

    return {
      success: true,
      platformPostId: postUrn ?? undefined,
      url: postUrn
        ? `https://www.linkedin.com/feed/update/${postUrn}`
        : undefined,
    };
  } catch (error) {
    if (error instanceof PlatformError) {
      return {
        success: false,
        error: `[LinkedIn] ${error.message}`,
      };
    }
    return {
      success: false,
      error: `[LinkedIn] ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
