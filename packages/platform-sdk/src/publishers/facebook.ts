import { rateLimitAwareFetch } from "../rate-limiter";
import { PlatformError } from "../errors";
import type { PublishPayload, PublishResult } from "./index";

const GRAPH_API_VERSION = "v19.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface GraphApiError {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
}

function classifyFacebookError(body: GraphApiError): {
  message: string;
  retryable: boolean;
} {
  const err = body.error;
  if (!err) return { message: "Unknown Facebook API error", retryable: false };

  // Expired or invalid token (code 190)
  if (err.code === 190) {
    return {
      message: `Token error: ${err.message ?? "Access token expired or invalid"}`,
      retryable: false,
    };
  }

  // Rate limiting (code 4 or 32)
  if (err.code === 4 || err.code === 32) {
    return {
      message: `Rate limited: ${err.message ?? "Too many API calls"}`,
      retryable: true,
    };
  }

  // Content policy / spam (code 368)
  if (err.code === 368) {
    return {
      message: `Content policy violation: ${err.message ?? "Content blocked by Facebook"}`,
      retryable: false,
    };
  }

  // Permissions error (codes 10, 200-299)
  if (err.code === 10 || (err.code && err.code >= 200 && err.code <= 299)) {
    return {
      message: `Permission denied: ${err.message ?? "Insufficient permissions"}`,
      retryable: false,
    };
  }

  return {
    message: err.message ?? "Facebook API error",
    retryable: (err.code ?? 0) >= 500,
  };
}

/**
 * Publish a post to a Facebook Page.
 *
 * For text-only posts: POST /{pageId}/feed with message
 * For photo posts: POST /{pageId}/photos with url + message
 * For multi-photo posts: publish each photo unpublished, then create a multi-photo post
 */
export async function publishToFacebook(
  payload: PublishPayload
): Promise<PublishResult> {
  const { content, mediaUrls, accessToken, platformUserId: pageId } = payload;

  try {
    // Multi-photo post (carousel-like)
    if (mediaUrls && mediaUrls.length > 1) {
      return await publishMultiPhotoPost(pageId, content, mediaUrls, accessToken);
    }

    // Single photo post
    if (mediaUrls && mediaUrls.length === 1) {
      return await publishPhotoPost(pageId, content, mediaUrls[0]!, accessToken);
    }

    // Text-only post
    return await publishTextPost(pageId, content, accessToken);
  } catch (error) {
    if (error instanceof PlatformError) {
      return {
        success: false,
        error: `[Facebook] ${error.message}`,
      };
    }
    return {
      success: false,
      error: `[Facebook] ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function publishTextPost(
  pageId: string,
  message: string,
  accessToken: string
): Promise<PublishResult> {
  const response = await rateLimitAwareFetch(
    `${GRAPH_BASE}/${pageId}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, access_token: accessToken }),
    },
    "FACEBOOK"
  );

  const body = (await response.json()) as GraphApiError & { id?: string };

  if (!response.ok) {
    const { message: errMsg, retryable } = classifyFacebookError(body);
    if (retryable) {
      throw PlatformError.fromResponse("FACEBOOK", response.status, errMsg);
    }
    return { success: false, error: errMsg };
  }

  const postId = body.id;
  return {
    success: true,
    platformPostId: postId,
    url: postId ? `https://facebook.com/${postId.replace("_", "/posts/")}` : undefined,
  };
}

async function publishPhotoPost(
  pageId: string,
  message: string,
  photoUrl: string,
  accessToken: string
): Promise<PublishResult> {
  const response = await rateLimitAwareFetch(
    `${GRAPH_BASE}/${pageId}/photos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: photoUrl,
        message,
        access_token: accessToken,
      }),
    },
    "FACEBOOK"
  );

  const body = (await response.json()) as GraphApiError & {
    id?: string;
    post_id?: string;
  };

  if (!response.ok) {
    const { message: errMsg, retryable } = classifyFacebookError(body);
    if (retryable) {
      throw PlatformError.fromResponse("FACEBOOK", response.status, errMsg);
    }
    return { success: false, error: errMsg };
  }

  const postId = body.post_id ?? body.id;
  return {
    success: true,
    platformPostId: postId,
    url: postId ? `https://facebook.com/${postId.replace("_", "/posts/")}` : undefined,
  };
}

async function publishMultiPhotoPost(
  pageId: string,
  message: string,
  photoUrls: string[],
  accessToken: string
): Promise<PublishResult> {
  // Step 1: Upload each photo as unpublished
  const photoIds: string[] = [];

  for (const photoUrl of photoUrls) {
    const response = await rateLimitAwareFetch(
      `${GRAPH_BASE}/${pageId}/photos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: photoUrl,
          published: false,
          access_token: accessToken,
        }),
      },
      "FACEBOOK"
    );

    const body = (await response.json()) as GraphApiError & { id?: string };

    if (!response.ok) {
      const { message: errMsg } = classifyFacebookError(body);
      return { success: false, error: `Failed to upload photo: ${errMsg}` };
    }

    if (body.id) {
      photoIds.push(body.id);
    }
  }

  // Step 2: Create a feed post referencing all uploaded photos
  const attachedMedia = photoIds.reduce(
    (acc, id, index) => {
      acc[`attached_media[${index}]`] = JSON.stringify({ media_fbid: id });
      return acc;
    },
    {} as Record<string, string>
  );

  const response = await rateLimitAwareFetch(
    `${GRAPH_BASE}/${pageId}/feed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        ...attachedMedia,
        access_token: accessToken,
      }),
    },
    "FACEBOOK"
  );

  const body = (await response.json()) as GraphApiError & { id?: string };

  if (!response.ok) {
    const { message: errMsg, retryable } = classifyFacebookError(body);
    if (retryable) {
      throw PlatformError.fromResponse("FACEBOOK", response.status, errMsg);
    }
    return { success: false, error: errMsg };
  }

  const postId = body.id;
  return {
    success: true,
    platformPostId: postId,
    url: postId ? `https://facebook.com/${postId.replace("_", "/posts/")}` : undefined,
  };
}
