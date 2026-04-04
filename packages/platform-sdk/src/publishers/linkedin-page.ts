import { rateLimitAwareFetch } from "../rate-limiter";
import { PlatformError } from "../errors";
import type { PublishPayload, PublishResult } from "./index";

const LINKEDIN_API_BASE = "https://api.linkedin.com";

interface LinkedInApiError {
  message?: string;
  status?: number;
}

/**
 * Publish a post to a LinkedIn Company Page using the Posts API.
 *
 * The platformUserId should be the organization ID (numeric).
 * Posts are authored as `urn:li:organization:{orgId}`.
 */
export async function publishToLinkedinPage(
  payload: PublishPayload
): Promise<PublishResult> {
  const { content, mediaUrls, accessToken, platformUserId } = payload;

  try {
    const authorUrn = platformUserId.startsWith("urn:")
      ? platformUserId
      : `urn:li:organization:${platformUserId}`;

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
      "LINKEDIN_PAGE"
    );

    if (!response.ok) {
      const responseBody = (await response.json()) as LinkedInApiError;
      const message = responseBody.message ?? "LinkedIn API error";
      if (response.status >= 500 || response.status === 429) {
        throw PlatformError.fromResponse("LINKEDIN_PAGE", response.status, message);
      }
      return { success: false, error: message };
    }

    const postUrn = response.headers.get("x-restli-id");

    return {
      success: true,
      platformPostId: postUrn ?? undefined,
      url: postUrn
        ? `https://www.linkedin.com/feed/update/${postUrn}`
        : undefined,
    };
  } catch (error) {
    if (error instanceof PlatformError) {
      return { success: false, error: `[LinkedIn Page] ${error.message}` };
    }
    return {
      success: false,
      error: `[LinkedIn Page] ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
