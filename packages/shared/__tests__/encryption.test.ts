import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../src/encryption";

const TEST_KEY = "0".repeat(64); // 32 bytes in hex

describe("encryption", () => {
  it("should encrypt and decrypt a string roundtrip", () => {
    const plaintext = "my-secret-access-token";
    const encrypted = encrypt(plaintext, TEST_KEY);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertext for same plaintext (unique IV)", () => {
    const plaintext = "same-token";
    const encrypted1 = encrypt(plaintext, TEST_KEY);
    const encrypted2 = encrypt(plaintext, TEST_KEY);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("should fail to decrypt with wrong key", () => {
    const plaintext = "secret";
    const encrypted = encrypt(plaintext, TEST_KEY);
    const wrongKey = "1".repeat(64);
    expect(() => decrypt(encrypted, wrongKey)).toThrow();
  });

  it("should handle empty strings", () => {
    const encrypted = encrypt("", TEST_KEY);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe("");
  });

  it("should handle unicode strings", () => {
    const plaintext = "token-with-unicode-\u00e9\u00e8\u00ea";
    const encrypted = encrypt(plaintext, TEST_KEY);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });
});
