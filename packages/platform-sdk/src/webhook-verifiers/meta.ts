import { createHmac } from "crypto";

export function verifyMetaWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const expectedSig = createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");
  return `sha256=${expectedSig}` === signature;
}
