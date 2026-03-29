import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenManager } from "../src/token-manager";

const TEST_KEY = "0".repeat(64);

describe("TokenManager", () => {
  let manager: TokenManager;

  beforeEach(() => {
    manager = new TokenManager(TEST_KEY);
  });

  describe("encryptTokens / decryptTokens", () => {
    it("should encrypt and decrypt access token roundtrip", () => {
      const encrypted = manager.encryptToken("my-access-token");
      const decrypted = manager.decryptToken(encrypted);
      expect(decrypted).toBe("my-access-token");
    });

    it("should produce different ciphertext each time", () => {
      const e1 = manager.encryptToken("token");
      const e2 = manager.encryptToken("token");
      expect(e1).not.toBe(e2);
    });
  });

  describe("isTokenExpiring", () => {
    it("should return true if token expires within 5 minutes", () => {
      const expiresAt = new Date(Date.now() + 4 * 60 * 1000); // 4 min from now
      expect(manager.isTokenExpiring(expiresAt)).toBe(true);
    });

    it("should return false if token expires in more than 5 minutes", () => {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now
      expect(manager.isTokenExpiring(expiresAt)).toBe(false);
    });

    it("should return true if token is already expired", () => {
      const expiresAt = new Date(Date.now() - 1000);
      expect(manager.isTokenExpiring(expiresAt)).toBe(true);
    });

    it("should return false if no expiry date", () => {
      expect(manager.isTokenExpiring(undefined)).toBe(false);
    });
  });

  describe("shouldProactivelyRefresh", () => {
    it("should return true if token expires within 7 days", () => {
      const expiresAt = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000); // 6 days
      expect(manager.shouldProactivelyRefresh(expiresAt)).toBe(true);
    });

    it("should return false if token expires in more than 7 days", () => {
      const expiresAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days
      expect(manager.shouldProactivelyRefresh(expiresAt)).toBe(false);
    });
  });
});
