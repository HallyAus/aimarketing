import type { PublishPayload, PublishResult } from "./index";
import { publishToFacebook } from "./facebook";
import { publishToInstagram } from "./instagram";
import { publishToTwitter } from "./twitter";
import { publishToLinkedin } from "./linkedin";

const SUPPORTED_PUBLISHERS: Record<
  string,
  (payload: PublishPayload) => Promise<PublishResult>
> = {
  FACEBOOK: publishToFacebook,
  INSTAGRAM: publishToInstagram,
  TWITTER_X: publishToTwitter,
  LINKEDIN: publishToLinkedin,
};

/**
 * Route a publish request to the correct platform-specific publisher.
 *
 * Supported platforms: FACEBOOK, INSTAGRAM, TWITTER_X, LINKEDIN
 * Unsupported platforms return a graceful error.
 */
export async function publishPost(
  platform: string,
  payload: PublishPayload
): Promise<PublishResult> {
  const publisher = SUPPORTED_PUBLISHERS[platform];

  if (!publisher) {
    return {
      success: false,
      error: `Publishing not yet supported for ${platform}`,
    };
  }

  return publisher(payload);
}
