import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { verifyMetaWebhookSignature } from "../../src/webhook-verifiers/meta";

describe("verifyMetaWebhookSignature", () => {
  const appSecret = "test-secret-key";
  const payload = '{"entry":[{"id":"123"}]}';

  it("should verify a valid signature", () => {
    const expectedSig = createHmac("sha256", appSecret)
      .update(payload)
      .digest("hex");
    const signature = `sha256=${expectedSig}`;

    expect(verifyMetaWebhookSignature(payload, signature, appSecret)).toBe(true);
  });

  it("should reject an invalid signature", () => {
    expect(
      verifyMetaWebhookSignature(payload, "sha256=invalid", appSecret)
    ).toBe(false);
  });

  it("should reject a tampered payload", () => {
    const expectedSig = createHmac("sha256", appSecret)
      .update(payload)
      .digest("hex");
    const signature = `sha256=${expectedSig}`;

    expect(
      verifyMetaWebhookSignature("tampered", signature, appSecret)
    ).toBe(false);
  });
});
