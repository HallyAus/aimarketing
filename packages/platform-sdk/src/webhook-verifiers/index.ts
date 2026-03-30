import { verifyMetaWebhookSignature } from "./meta";
import { verifyTikTokWebhookSignature } from "./tiktok";
import { verifySnapchatWebhookSignature } from "./snapchat";

export type WebhookVerifier = (
  payload: string,
  signature: string
) => boolean;

export function getWebhookVerifier(platform: string): WebhookVerifier | null {
  switch (platform.toUpperCase()) {
    case "FACEBOOK":
    case "INSTAGRAM": {
      const secret = process.env.FACEBOOK_APP_SECRET;
      if (!secret) throw new Error("FACEBOOK_APP_SECRET is required for webhook verification");
      return (payload, signature) =>
        verifyMetaWebhookSignature(payload, signature, secret);
    }
    case "TIKTOK": {
      const secret = process.env.TIKTOK_CLIENT_SECRET;
      if (!secret) throw new Error("TIKTOK_CLIENT_SECRET is required for webhook verification");
      return (payload, signature) =>
        verifyTikTokWebhookSignature(payload, signature, secret);
    }
    case "SNAPCHAT": {
      const secret = process.env.SNAPCHAT_CLIENT_SECRET;
      if (!secret) throw new Error("SNAPCHAT_CLIENT_SECRET is required for webhook verification");
      return (payload, signature) =>
        verifySnapchatWebhookSignature(payload, signature, secret);
    }
    default:
      return null; // Platform doesn't have webhook verification configured
  }
}

export { verifyMetaWebhookSignature };
export { verifyTikTokWebhookSignature };
export { verifySnapchatWebhookSignature };
