import { verifyMetaWebhookSignature } from "./meta";

export type WebhookVerifier = (
  payload: string,
  signature: string
) => boolean;

export function getWebhookVerifier(platform: string): WebhookVerifier | null {
  switch (platform.toUpperCase()) {
    case "FACEBOOK":
    case "INSTAGRAM":
      return (payload, signature) =>
        verifyMetaWebhookSignature(
          payload,
          signature,
          process.env.FACEBOOK_APP_SECRET ?? ""
        );
    default:
      return null; // Platform doesn't have webhook verification configured
  }
}

export { verifyMetaWebhookSignature };
