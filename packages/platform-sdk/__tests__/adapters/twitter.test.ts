import { describe, it, expect, vi } from "vitest";
import { TwitterAdapter } from "../../src/adapters/twitter";

vi.stubEnv("TWITTER_CLIENT_ID", "test-client-id");
vi.stubEnv("TWITTER_CLIENT_SECRET", "test-client-secret");

describe("TwitterAdapter", () => {
  const adapter = new TwitterAdapter();

  describe("getAuthorizeUrl", () => {
    it("should generate URL with PKCE challenge", async () => {
      const result = await adapter.getAuthorizeUrl({
        orgId: "org-1",
        userId: "user-1",
        redirectUri: "http://localhost:3000/api/platforms/TWITTER_X/callback",
      });

      const url = new URL(result.url);
      expect(url.hostname).toBe("twitter.com");
      expect(url.searchParams.get("code_challenge")).toBeTruthy();
      expect(url.searchParams.get("code_challenge_method")).toBe("S256");
      expect(result.codeVerifier).toBeTruthy();
      expect(result.state).toHaveLength(64);
    });

    it("should include offline.access scope", async () => {
      const result = await adapter.getAuthorizeUrl({
        orgId: "org-1",
        userId: "user-1",
        redirectUri: "http://localhost:3000/api/platforms/TWITTER_X/callback",
      });

      const url = new URL(result.url);
      expect(url.searchParams.get("scope")).toContain("offline.access");
    });
  });
});
