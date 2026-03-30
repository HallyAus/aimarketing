import { rateLimitAwareFetch } from "../rate-limiter";
import { PlatformError } from "../errors";
import type { PublishPayload, PublishResult } from "./index";

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

interface LinkedInApiError {
  message?: string;
  status?: number;
  serviceErrorCode?: number;
}

interface UgcPostResponse {
  id?: string;
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
 * Build a LinkedIn UGC post body.
 *
 * For text-only: shareCommentary with no media
 * For image posts: reference image URLs as ARTICLE shares (LinkedIn requires
 * pre-registered image assets for native images, so we use article shares
 * with thumbnail URLs as a simpler approach)
 */
function buildUgcPostBody(
  authorUrn: string,
  content: string,
  mediaUrls?: string[]
): Record<string, unknown> {
  const shareMediaCategory =
    mediaUrls && mediaUrls.length > 0 ? "ARTICLE" : "NONE";

  const media =
    mediaUrls && mediaUrls.length > 0
      ? mediaUrls.map((url) => ({
          status: "READY",
          originalUrl: url,
          description: { text: content.substring(0, 200) },
        }))
      : [];

  return {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory,
        ...(media.length > 0 ? { media } : {}),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };
}

/**
 * Publish a post to LinkedIn.
 *
 * Uses the UGC Posts API (v2/ugcPosts) with the author's person URN.
 * The platformUserId should be the LinkedIn member/organization ID.
 */
export async function publishToLinkedin(
  payload: PublishPayload
): Promise<PublishResult> {
  const { content, mediaUrls, accessToken, platformUserId } = payload;

  try {
    // Construct the author URN — prefer organization if the ID looks like one,
    // otherwise assume it's a person
    const authorUrn = platformUserId.startsWith("urn:")
      ? platformUserId
      : `urn:li:person:${platformUserId}`;

    const body = buildUgcPostBody(authorUrn, content, mediaUrls);

    const response = await rateLimitAwareFetch(
      `${LINKEDIN_API_BASE}/ugcPosts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(body),
      },
      "LINKEDIN"
    );

    const responseBody = (await response.json()) as UgcPostResponse & LinkedInApiError;

    if (!response.ok) {
      const { message, retryable } = classifyLinkedInError(
        response.status,
        responseBody
      );
      if (retryable) {
        throw PlatformError.fromResponse("LINKEDIN", response.status, message);
      }
      return { success: false, error: message };
    }

    // LinkedIn returns the post URN as the id (e.g., "urn:li:share:12345")
    const postUrn = responseBody.id;
    const shareId = postUrn?.split(":").pop();

    return {
      success: true,
      platformPostId: postUrn ?? undefined,
      url: shareId
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
