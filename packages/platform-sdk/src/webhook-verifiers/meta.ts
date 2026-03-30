import { createHmac, timingSafeEqual } from "crypto";

export function verifyMetaWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const expectedSig = createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");

  const expected = Buffer.from(`sha256=${expectedSig}`);
  const actual = Buffer.from(signature);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
