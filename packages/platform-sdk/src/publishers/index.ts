export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  error?: string;
  url?: string;
}

export interface PublishPayload {
  content: string;
  mediaUrls?: string[];
  platform: string;
  accessToken: string;
  platformUserId: string;
}

export { publishToFacebook } from "./facebook";
export { publishToInstagram } from "./instagram";
export { publishToTwitter } from "./twitter";
export { publishToLinkedin } from "./linkedin";
export { publishPost } from "./router";
