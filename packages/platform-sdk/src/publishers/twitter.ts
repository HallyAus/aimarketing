import { rateLimitAwareFetch } from "../rate-limiter";
import { PlatformError } from "../errors";
import type { PublishPayload, PublishResult } from "./index";

const TWITTER_API_BASE = "https://api.twitter.com/2";
const TWITTER_UPLOAD_BASE = "https://upload.twitter.com/1.1";

interface TwitterApiError {
  errors?: Array<{ message?: string; code?: number }>;
  detail?: string;
  title?: string;
}

interface TweetResponse {
  data?: {
    id?: string;
    text?: string;
  };
}

interface MediaUploadResponse {
  media_id_string?: string;
  processing_info?: {
    state: "pending" | "in_progress" | "failed" | "succeeded";
    check_after_secs?: number;
    error?: { message?: string };
  };
}

function classifyTwitterError(
  status: number,
  body: TwitterApiError
): { message: string; retryable: boolean } {
  if (status === 401) {
    return {
      message: `Authentication failed: ${body.detail ?? "Invalid or expired token"}`,
      retryable: false,
    };
  }

  if (status === 403) {
    const msg = body.errors?.[0]?.message ?? body.detail ?? "Forbidden";
    return { message: `Forbidden: ${msg}`, retryable: false };
  }

  if (status === 429) {
    return {
      message: "Rate limited by Twitter/X API",
      retryable: true,
    };
  }

  const fallback =
    body.errors?.[0]?.message ?? body.detail ?? body.title ?? "Twitter API error";
  return {
    message: fallback,
    retryable: status >= 500,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload media to Twitter via the chunked media upload endpoint.
 * For simplicity, this uses URL-based media — downloads the image and uploads it.
 * Returns the media_id_string to attach to the tweet.
 */
async function uploadMedia(
  mediaUrl: string,
  accessToken: string
): Promise<string> {
  // Download the media file
  const mediaResponse = await fetch(mediaUrl);
  if (!mediaResponse.ok) {
    throw new Error(`Failed to download media from ${mediaUrl}: ${mediaResponse.status}`);
  }

  const mediaBuffer = await mediaResponse.arrayBuffer();
  const contentType = mediaResponse.headers.get("Content-Type") ?? "image/jpeg";
  const totalBytes = mediaBuffer.byteLength;

  // INIT
  const initResponse = await rateLimitAwareFetch(
    `${TWITTER_UPLOAD_BASE}/media/upload.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        command: "INIT",
        total_bytes: totalBytes,
        media_type: contentType,
      }),
    },
    "TWITTER_X"
  );

  if (!initResponse.ok) {
    const text = await initResponse.text();
    throw new Error(`Twitter media INIT failed (${initResponse.status}): ${text}`);
  }

  const initData = (await initResponse.json()) as MediaUploadResponse;
  const mediaIdString = initData.media_id_string;
  if (!mediaIdString) {
    throw new Error("Twitter media INIT did not return media_id_string");
  }

  // APPEND — send the entire payload as a single chunk
  const formData = new FormData();
  formData.append("command", "APPEND");
  formData.append("media_id", mediaIdString);
  formData.append("segment_index", "0");
  formData.append("media_data", Buffer.from(mediaBuffer).toString("base64"));

  const appendResponse = await rateLimitAwareFetch(
    `${TWITTER_UPLOAD_BASE}/media/upload.json`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    },
    "TWITTER_X"
  );

  if (!appendResponse.ok) {
    const text = await appendResponse.text();
    throw new Error(`Twitter media APPEND failed (${appendResponse.status}): ${text}`);
  }

  // FINALIZE
  const finalizeResponse = await rateLimitAwareFetch(
    `${TWITTER_UPLOAD_BASE}/media/upload.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        command: "FINALIZE",
        media_id: mediaIdString,
      }),
    },
    "TWITTER_X"
  );

  if (!finalizeResponse.ok) {
    const text = await finalizeResponse.text();
    throw new Error(`Twitter media FINALIZE failed (${finalizeResponse.status}): ${text}`);
  }

  const finalizeData = (await finalizeResponse.json()) as MediaUploadResponse;

  // If async processing is needed, poll STATUS until complete
  if (finalizeData.processing_info) {
    await waitForMediaProcessing(mediaIdString, accessToken);
  }

  return mediaIdString;
}

async function waitForMediaProcessing(
  mediaId: string,
  accessToken: string
): Promise<void> {
  const maxWaitMs = 60_000;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const statusResponse = await rateLimitAwareFetch(
      `${TWITTER_UPLOAD_BASE}/media/upload.json?command=STATUS&media_id=${mediaId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      "TWITTER_X"
    );

    if (!statusResponse.ok) break;

    const statusData = (await statusResponse.json()) as MediaUploadResponse;
    const state = statusData.processing_info?.state;

    if (state === "succeeded" || !state) return;
    if (state === "failed") {
      throw new Error(
        `Twitter media processing failed: ${statusData.processing_info?.error?.message ?? "unknown"}`
      );
    }

    const waitSecs = statusData.processing_info?.check_after_secs ?? 5;
    await sleep(waitSecs * 1000);
  }
}

/**
 * Publish a tweet to Twitter/X.
 *
 * Text-only: POST /2/tweets with { text }
 * With media: upload media first, then attach media_ids
 */
export async function publishToTwitter(
  payload: PublishPayload
): Promise<PublishResult> {
  const { content, mediaUrls, accessToken } = payload;

  try {
    // Upload media if present
    let mediaIds: string[] | undefined;

    if (mediaUrls && mediaUrls.length > 0) {
      mediaIds = [];
      for (const url of mediaUrls) {
        const mediaId = await uploadMedia(url, accessToken);
        mediaIds.push(mediaId);
      }
    }

    // Create tweet
    const tweetBody: Record<string, unknown> = { text: content };
    if (mediaIds && mediaIds.length > 0) {
      tweetBody.media = { media_ids: mediaIds };
    }

    const response = await rateLimitAwareFetch(
      `${TWITTER_API_BASE}/tweets`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tweetBody),
      },
      "TWITTER_X"
    );

    const body = (await response.json()) as TweetResponse & TwitterApiError;

    if (!response.ok) {
      const { message, retryable } = classifyTwitterError(response.status, body);
      if (retryable) {
        throw PlatformError.fromResponse("TWITTER_X", response.status, message);
      }
      return { success: false, error: message };
    }

    const tweetId = body.data?.id;
    return {
      success: true,
      platformPostId: tweetId,
      url: tweetId
        ? `https://x.com/i/status/${tweetId}`
        : undefined,
    };
  } catch (error) {
    if (error instanceof PlatformError) {
      return {
        success: false,
        error: `[Twitter/X] ${error.message}`,
      };
    }
    return {
      success: false,
      error: `[Twitter/X] ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
