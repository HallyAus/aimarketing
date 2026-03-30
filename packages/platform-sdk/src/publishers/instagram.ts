import { rateLimitAwareFetch } from "../rate-limiter";
import { PlatformError } from "../errors";
import type { PublishPayload, PublishResult } from "./index";

const GRAPH_API_VERSION = "v19.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/** Max time to wait for Instagram media container to finish processing */
const CONTAINER_POLL_TIMEOUT_MS = 60_000;
const CONTAINER_POLL_INTERVAL_MS = 3_000;

interface GraphApiError {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
}

interface ContainerStatusResponse {
  status_code?: "FINISHED" | "IN_PROGRESS" | "ERROR" | "EXPIRED";
  status?: string;
  id?: string;
}

function classifyInstagramError(body: GraphApiError): {
  message: string;
  retryable: boolean;
} {
  const err = body.error;
  if (!err) return { message: "Unknown Instagram API error", retryable: false };

  if (err.code === 190) {
    return {
      message: `Token error: ${err.message ?? "Access token expired or invalid"}`,
      retryable: false,
    };
  }

  if (err.code === 4 || err.code === 32) {
    return {
      message: `Rate limited: ${err.message ?? "Too many API calls"}`,
      retryable: true,
    };
  }

  // Instagram-specific: media processing errors (code 36003)
  if (err.error_subcode === 36003) {
    return {
      message: `Media error: ${err.message ?? "Unable to process media"}`,
      retryable: false,
    };
  }

  return {
    message: err.message ?? "Instagram API error",
    retryable: (err.code ?? 0) >= 500,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for an Instagram media container to finish processing.
 * Instagram processes uploaded media asynchronously; we poll until FINISHED or timeout.
 */
async function waitForContainerReady(
  containerId: string,
  accessToken: string
): Promise<void> {
  const deadline = Date.now() + CONTAINER_POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const response = await rateLimitAwareFetch(
      `${GRAPH_BASE}/${containerId}?fields=status_code,status&access_token=${accessToken}`,
      { method: "GET" },
      "INSTAGRAM"
    );

    const body = (await response.json()) as ContainerStatusResponse & GraphApiError;

    if (body.status_code === "FINISHED") {
      return;
    }

    if (body.status_code === "ERROR" || body.status_code === "EXPIRED") {
      throw new Error(
        `Instagram container ${containerId} failed: ${body.status ?? body.status_code}`
      );
    }

    // Still IN_PROGRESS — wait and poll again
    await sleep(CONTAINER_POLL_INTERVAL_MS);
  }

  throw new Error(
    `Instagram container ${containerId} did not finish within ${CONTAINER_POLL_TIMEOUT_MS / 1000}s`
  );
}

/**
 * Publish to Instagram Business Account via the Graph API.
 *
 * Instagram publishing is a 2-step process:
 *   1. Create a media container (image/video/carousel)
 *   2. Publish the container
 *
 * For carousel posts (multiple images):
 *   1. Create individual item containers for each image
 *   2. Create a carousel container referencing them
 *   3. Publish the carousel container
 */
export async function publishToInstagram(
  payload: PublishPayload
): Promise<PublishResult> {
  const { content, mediaUrls, accessToken, platformUserId: igUserId } = payload;

  try {
    if (!mediaUrls || mediaUrls.length === 0) {
      return {
        success: false,
        error: "Instagram requires at least one image or video to publish",
      };
    }

    if (mediaUrls.length > 1) {
      return await publishCarousel(igUserId, content, mediaUrls, accessToken);
    }

    return await publishSingleMedia(igUserId, content, mediaUrls[0]!, accessToken);
  } catch (error) {
    if (error instanceof PlatformError) {
      return {
        success: false,
        error: `[Instagram] ${error.message}`,
      };
    }
    return {
      success: false,
      error: `[Instagram] ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function publishSingleMedia(
  igUserId: string,
  caption: string,
  imageUrl: string,
  accessToken: string
): Promise<PublishResult> {
  // Step 1: Create media container
  const createResponse = await rateLimitAwareFetch(
    `${GRAPH_BASE}/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    },
    "INSTAGRAM"
  );

  const createBody = (await createResponse.json()) as GraphApiError & { id?: string };

  if (!createResponse.ok) {
    const { message, retryable } = classifyInstagramError(createBody);
    if (retryable) {
      throw PlatformError.fromResponse("INSTAGRAM", createResponse.status, message);
    }
    return { success: false, error: message };
  }

  const containerId = createBody.id;
  if (!containerId) {
    return { success: false, error: "Instagram did not return a container ID" };
  }

  // Wait for container to be ready
  await waitForContainerReady(containerId, accessToken);

  // Step 2: Publish the container
  const publishResponse = await rateLimitAwareFetch(
    `${GRAPH_BASE}/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    },
    "INSTAGRAM"
  );

  const publishBody = (await publishResponse.json()) as GraphApiError & { id?: string };

  if (!publishResponse.ok) {
    const { message, retryable } = classifyInstagramError(publishBody);
    if (retryable) {
      throw PlatformError.fromResponse("INSTAGRAM", publishResponse.status, message);
    }
    return { success: false, error: message };
  }

  const mediaId = publishBody.id;
  return {
    success: true,
    platformPostId: mediaId,
    url: mediaId
      ? `https://www.instagram.com/p/${mediaId}/`
      : undefined,
  };
}

async function publishCarousel(
  igUserId: string,
  caption: string,
  imageUrls: string[],
  accessToken: string
): Promise<PublishResult> {
  // Step 1: Create individual item containers (no caption on items)
  const childIds: string[] = [];

  for (const imageUrl of imageUrls) {
    const response = await rateLimitAwareFetch(
      `${GRAPH_BASE}/${igUserId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          is_carousel_item: true,
          access_token: accessToken,
        }),
      },
      "INSTAGRAM"
    );

    const body = (await response.json()) as GraphApiError & { id?: string };

    if (!response.ok) {
      const { message } = classifyInstagramError(body);
      return { success: false, error: `Failed to create carousel item: ${message}` };
    }

    if (!body.id) {
      return { success: false, error: "Instagram did not return a container ID for carousel item" };
    }

    childIds.push(body.id);
  }

  // Wait for all child containers to be ready
  for (const childId of childIds) {
    await waitForContainerReady(childId, accessToken);
  }

  // Step 2: Create the carousel container
  const carouselResponse = await rateLimitAwareFetch(
    `${GRAPH_BASE}/${igUserId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        caption,
        children: childIds,
        access_token: accessToken,
      }),
    },
    "INSTAGRAM"
  );

  const carouselBody = (await carouselResponse.json()) as GraphApiError & { id?: string };

  if (!carouselResponse.ok) {
    const { message, retryable } = classifyInstagramError(carouselBody);
    if (retryable) {
      throw PlatformError.fromResponse("INSTAGRAM", carouselResponse.status, message);
    }
    return { success: false, error: message };
  }

  const carouselContainerId = carouselBody.id;
  if (!carouselContainerId) {
    return { success: false, error: "Instagram did not return a carousel container ID" };
  }

  await waitForContainerReady(carouselContainerId, accessToken);

  // Step 3: Publish the carousel
  const publishResponse = await rateLimitAwareFetch(
    `${GRAPH_BASE}/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: carouselContainerId,
        access_token: accessToken,
      }),
    },
    "INSTAGRAM"
  );

  const publishBody = (await publishResponse.json()) as GraphApiError & { id?: string };

  if (!publishResponse.ok) {
    const { message, retryable } = classifyInstagramError(publishBody);
    if (retryable) {
      throw PlatformError.fromResponse("INSTAGRAM", publishResponse.status, message);
    }
    return { success: false, error: message };
  }

  const mediaId = publishBody.id;
  return {
    success: true,
    platformPostId: mediaId,
    url: mediaId
      ? `https://www.instagram.com/p/${mediaId}/`
      : undefined,
  };
}
