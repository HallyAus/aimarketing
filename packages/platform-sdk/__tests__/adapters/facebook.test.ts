import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FacebookAdapter } from "../../src/adapters/facebook";

// Mock env vars
vi.stubEnv("FACEBOOK_APP_ID", "test-app-id");
vi.stubEnv("FACEBOOK_APP_SECRET", "test-app-secret");

describe("FacebookAdapter", () => {
  let adapter: FacebookAdapter;

  beforeEach(() => {
    adapter = new FacebookAdapter();
  });

  describe("getAuthorizeUrl", () => {
    it("should generate a valid Facebook OAuth URL", async () => {
      const result = await adapter.getAuthorizeUrl({
        orgId: "org-1",
        userId: "user-1",
        redirectUri: "http://localhost:3000/api/platforms/FACEBOOK/callback",
      });

      const url = new URL(result.url);
      expect(url.hostname).toBe("www.facebook.com");
      expect(url.searchParams.get("client_id")).toBe("test-app-id");
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("state")).toBe(result.state);
      expect(result.state).toHaveLength(64); // 32 bytes hex
    });

    it("should include required scopes", async () => {
      const result = await adapter.getAuthorizeUrl({
        orgId: "org-1",
        userId: "user-1",
        redirectUri: "http://localhost:3000/api/platforms/FACEBOOK/callback",
      });

      const url = new URL(result.url);
      const scopes = url.searchParams.get("scope")!;
      expect(scopes).toContain("pages_manage_posts");
      expect(scopes).toContain("pages_read_engagement");
    });
  });

  describe("refreshToken", () => {
    it("should throw because Facebook uses token exchange", async () => {
      await expect(adapter.refreshToken("token")).rejects.toThrow(
        "Facebook uses token exchange"
      );
    });
  });
});
