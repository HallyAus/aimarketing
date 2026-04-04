# Phase 2: Platform Connections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the unified platform connection system — OAuth2 flows for all 9 platform connections (Facebook, Instagram, TikTok, LinkedIn, Twitter/X, YouTube, Google Ads, Pinterest, Snapchat), encrypted token storage, lazy + proactive token refresh, webhook signature verification, connection management UI, and worker integration for token health checks.

**Architecture:** `packages/platform-sdk` becomes the unified wrapper for all platform APIs. Each platform gets an adapter implementing a common `PlatformAdapter` interface (authorize URL, token exchange, token refresh, revoke, validate). The web app exposes `/api/platforms/[platform]/authorize` and `/api/platforms/[platform]/callback` routes. The worker's `token:refresh` and `token:health-check` queues get real processors. The connections settings page shows a card grid with connect/disconnect/refresh actions.

**Tech Stack:** Next.js 15 API routes, packages/platform-sdk (TypeScript), Prisma (PlatformConnection model already exists), AES-256-GCM encryption (already in packages/shared), BullMQ (worker queues already defined), Vitest + MSW for testing

**Spec:** `docs/superpowers/specs/2026-03-29-reachpilot-foundation-design.md` — Section 6 (Platform Connection System)

**Depends on:** Phase 1 Foundation (complete)

---

## File Structure

```
packages/platform-sdk/
├── src/
│   ├── index.ts                          # Barrel exports
│   ├── types.ts                          # PlatformAdapter interface, shared types
│   ├── config.ts                         # Platform OAuth configs (URLs, scopes, secrets)
│   ├── client.ts                         # PlatformClient — unified entry point
│   ├── token-manager.ts                  # Lazy refresh logic, encrypt/decrypt helpers
│   ├── adapters/
│   │   ├── facebook.ts                   # Meta (Facebook) OAuth adapter
│   │   ├── instagram.ts                  # Meta (Instagram) OAuth adapter
│   │   ├── tiktok.ts                     # TikTok OAuth adapter
│   │   ├── linkedin.ts                   # LinkedIn OAuth adapter
│   │   ├── twitter.ts                    # Twitter/X OAuth2+PKCE adapter
│   │   ├── youtube.ts                    # YouTube OAuth adapter
│   │   ├── google-ads.ts                 # Google Ads OAuth adapter
│   │   ├── pinterest.ts                  # Pinterest OAuth adapter
│   │   ├── snapchat.ts                   # Snapchat OAuth adapter
│   │   └── index.ts                      # Adapter registry
│   └── webhook-verifiers/
│       ├── meta.ts                       # Meta (FB/IG) webhook signature verification
│       ├── tiktok.ts                     # TikTok webhook verification
│       └── index.ts                      # Verifier registry
├── __tests__/
│   ├── token-manager.test.ts             # Token refresh + encryption tests
│   ├── adapters/
│   │   ├── facebook.test.ts              # Facebook adapter tests (mocked HTTP)
│   │   └── twitter.test.ts               # Twitter PKCE adapter tests
│   └── webhook-verifiers/
│       └── meta.test.ts                  # Meta webhook verification tests
└── vitest.config.ts

apps/web/src/
├── app/api/platforms/
│   ├── [platform]/
│   │   ├── authorize/route.ts            # GET — generate OAuth URL + redirect
│   │   └── callback/route.ts             # GET — handle OAuth callback
│   └── [platform]/disconnect/route.ts    # POST — revoke + delete connection
├── app/api/webhooks/
│   └── [platform]/route.ts               # POST — platform webhook ingestion
└── app/(dashboard)/settings/
    └── connections/page.tsx               # Connection management UI (replace stub)

apps/worker/src/
├── processors/
│   ├── token-refresh.ts                  # token:refresh queue processor
│   └── token-health-check.ts             # token:health-check queue processor
└── index.ts                              # Modified to use real processors
```

---

### Task 1: Platform SDK Types & Config

**Files:**
- Create: `packages/platform-sdk/src/types.ts`
- Create: `packages/platform-sdk/src/config.ts`
- Modify: `packages/platform-sdk/src/index.ts`

- [ ] **Step 1: Create platform SDK types**

Create `packages/platform-sdk/src/types.ts`:

```typescript
export type Platform =
  | "FACEBOOK"
  | "INSTAGRAM"
  | "TIKTOK"
  | "LINKEDIN"
  | "TWITTER_X"
  | "YOUTUBE"
  | "GOOGLE_ADS"
  | "PINTEREST"
  | "SNAPCHAT";

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
  platformUserId: string;
  platformAccountName?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthorizeParams {
  orgId: string;
  userId: string;
  redirectUri: string;
}

export interface AuthorizeResult {
  url: string;
  state: string;
  codeVerifier?: string; // For PKCE flows
}

export interface CallbackParams {
  code: string;
  state: string;
  redirectUri: string;
  codeVerifier?: string;
}

export interface PlatformAdapter {
  platform: Platform;

  /** Generate the OAuth authorization URL */
  getAuthorizeUrl(params: AuthorizeParams): Promise<AuthorizeResult>;

  /** Exchange authorization code for tokens */
  exchangeCode(params: CallbackParams): Promise<OAuthTokens>;

  /** Refresh an expired access token */
  refreshToken(refreshToken: string): Promise<OAuthTokens>;

  /** Revoke a token (best-effort, some platforms don't support this) */
  revokeToken(accessToken: string): Promise<void>;

  /** Validate that a token is still active */
  validateToken(accessToken: string): Promise<boolean>;
}

export interface PlatformConfig {
  platform: Platform;
  displayName: string;
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  scopes: string[];
  tokenExpirySeconds?: number;
  refreshTokenExpiryDays?: number;
  usesPkce: boolean;
}
```

- [ ] **Step 2: Create platform config registry**

Create `packages/platform-sdk/src/config.ts`:

```typescript
import type { Platform, PlatformConfig } from "./types";

function env(key: string): string {
  return process.env[key] ?? "";
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  FACEBOOK: {
    platform: "FACEBOOK",
    displayName: "Facebook",
    clientId: env("FACEBOOK_APP_ID"),
    clientSecret: env("FACEBOOK_APP_SECRET"),
    authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    revokeUrl: undefined, // Use DELETE /{user-id}/permissions
    scopes: [
      "pages_manage_posts",
      "pages_read_engagement",
      "business_management",
      "ads_management",
    ],
    tokenExpirySeconds: 60 * 60, // Short-lived, exchanged for long-lived (60 days)
    refreshTokenExpiryDays: undefined, // Uses token exchange, not refresh tokens
    usesPkce: false,
  },
  INSTAGRAM: {
    platform: "INSTAGRAM",
    displayName: "Instagram",
    clientId: env("FACEBOOK_APP_ID"), // Same Meta app
    clientSecret: env("FACEBOOK_APP_SECRET"),
    authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
    scopes: [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_insights",
      "pages_show_list",
    ],
    tokenExpirySeconds: 60 * 60,
    usesPkce: false,
  },
  TIKTOK: {
    platform: "TIKTOK",
    displayName: "TikTok",
    clientId: env("TIKTOK_CLIENT_KEY"),
    clientSecret: env("TIKTOK_CLIENT_SECRET"),
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    revokeUrl: "https://open.tiktokapis.com/v2/oauth/revoke/",
    scopes: ["video.publish", "video.list", "user.info.basic", "video.insights"],
    tokenExpirySeconds: 86400, // 24 hours
    refreshTokenExpiryDays: 365,
    usesPkce: true,
  },
  LINKEDIN: {
    platform: "LINKEDIN",
    displayName: "LinkedIn",
    clientId: env("LINKEDIN_CLIENT_ID"),
    clientSecret: env("LINKEDIN_CLIENT_SECRET"),
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: [
      "r_liteprofile",
      "r_organization_social",
      "w_organization_social",
      "rw_organization_admin",
    ],
    tokenExpirySeconds: 60 * 60 * 24 * 60, // 60 days
    refreshTokenExpiryDays: 365,
    usesPkce: false,
  },
  TWITTER_X: {
    platform: "TWITTER_X",
    displayName: "Twitter / X",
    clientId: env("TWITTER_CLIENT_ID"),
    clientSecret: env("TWITTER_CLIENT_SECRET"),
    authorizeUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    revokeUrl: "https://api.twitter.com/2/oauth2/revoke",
    scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    tokenExpirySeconds: 7200, // 2 hours
    refreshTokenExpiryDays: 180, // ~6 months
    usesPkce: true,
  },
  YOUTUBE: {
    platform: "YOUTUBE",
    displayName: "YouTube",
    clientId: env("GOOGLE_ADS_CLIENT_ID"), // Shared Google OAuth
    clientSecret: env("GOOGLE_ADS_CLIENT_SECRET"),
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    revokeUrl: "https://oauth2.googleapis.com/revoke",
    scopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    tokenExpirySeconds: 3600, // 1 hour
    usesPkce: false,
  },
  GOOGLE_ADS: {
    platform: "GOOGLE_ADS",
    displayName: "Google Ads",
    clientId: env("GOOGLE_ADS_CLIENT_ID"),
    clientSecret: env("GOOGLE_ADS_CLIENT_SECRET"),
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    revokeUrl: "https://oauth2.googleapis.com/revoke",
    scopes: ["https://www.googleapis.com/auth/adwords"],
    tokenExpirySeconds: 3600,
    usesPkce: false,
  },
  PINTEREST: {
    platform: "PINTEREST",
    displayName: "Pinterest",
    clientId: env("PINTEREST_APP_ID"),
    clientSecret: env("PINTEREST_APP_SECRET"),
    authorizeUrl: "https://www.pinterest.com/oauth/",
    tokenUrl: "https://api.pinterest.com/v5/oauth/token",
    scopes: ["boards:read", "pins:read", "pins:write", "user_accounts:read"],
    tokenExpirySeconds: 3600, // 1 hour
    refreshTokenExpiryDays: 365,
    usesPkce: false,
  },
  SNAPCHAT: {
    platform: "SNAPCHAT",
    displayName: "Snapchat",
    clientId: env("SNAPCHAT_CLIENT_ID"),
    clientSecret: env("SNAPCHAT_CLIENT_SECRET"),
    authorizeUrl: "https://accounts.snapchat.com/login/oauth2/authorize",
    tokenUrl: "https://accounts.snapchat.com/login/oauth2/access_token",
    scopes: ["snapchat-marketing-api"],
    tokenExpirySeconds: 1800, // 30 minutes
    usesPkce: false,
  },
};

export function getPlatformConfig(platform: Platform): PlatformConfig {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return config;
}
```

- [ ] **Step 3: Update barrel export**

Replace `packages/platform-sdk/src/index.ts`:

```typescript
export * from "./types";
export { PLATFORM_CONFIGS, getPlatformConfig } from "./config";
```

- [ ] **Step 4: Install deps and verify**

Run: `cd packages/platform-sdk && pnpm install`

- [ ] **Step 5: Commit**

```bash
git add packages/platform-sdk/src
git commit -m "feat: add platform SDK types, adapter interface, and OAuth config for all 9 platforms"
```

---

### Task 2: Token Manager (Encrypt/Decrypt + Lazy Refresh)

**Files:**
- Create: `packages/platform-sdk/src/token-manager.ts`
- Create: `packages/platform-sdk/__tests__/token-manager.test.ts`
- Create: `packages/platform-sdk/vitest.config.ts`

- [ ] **Step 1: Create vitest config for platform-sdk**

Create `packages/platform-sdk/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

- [ ] **Step 2: Write failing tests for token manager**

Create `packages/platform-sdk/__tests__/token-manager.test.ts`:

```typescript
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
```

- [ ] **Step 3: Run tests — should FAIL**

Run: `cd packages/platform-sdk && pnpm test`

- [ ] **Step 4: Implement TokenManager**

Create `packages/platform-sdk/src/token-manager.ts`:

```typescript
import { encrypt, decrypt } from "@reachpilot/shared";

const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
const PROACTIVE_REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class TokenManager {
  constructor(private masterKey: string) {}

  encryptToken(plaintext: string): string {
    return encrypt(plaintext, this.masterKey);
  }

  decryptToken(ciphertext: string): string {
    return decrypt(ciphertext, this.masterKey);
  }

  /** Returns true if token is expired or expiring within 5 minutes */
  isTokenExpiring(expiresAt: Date | null | undefined): boolean {
    if (!expiresAt) return false;
    return expiresAt.getTime() - Date.now() < EXPIRY_BUFFER_MS;
  }

  /** Returns true if token should be proactively refreshed (within 7 days) */
  shouldProactivelyRefresh(expiresAt: Date | null | undefined): boolean {
    if (!expiresAt) return false;
    return expiresAt.getTime() - Date.now() < PROACTIVE_REFRESH_MS;
  }
}
```

- [ ] **Step 5: Add dependency on @reachpilot/shared and export**

Add `"@reachpilot/shared": "workspace:*"` to `packages/platform-sdk/package.json` dependencies (should already be there from Phase 1).

Add to `packages/platform-sdk/src/index.ts`:

```typescript
export { TokenManager } from "./token-manager";
```

- [ ] **Step 6: Run tests — ALL should PASS**

Run: `cd packages/platform-sdk && pnpm test`

- [ ] **Step 7: Commit**

```bash
git add packages/platform-sdk
git commit -m "feat: add TokenManager with encrypt/decrypt and expiry checking logic"
```

---

### Task 3: Base OAuth Adapter + Facebook Adapter

**Files:**
- Create: `packages/platform-sdk/src/adapters/base.ts`
- Create: `packages/platform-sdk/src/adapters/facebook.ts`
- Create: `packages/platform-sdk/src/adapters/index.ts`
- Create: `packages/platform-sdk/__tests__/adapters/facebook.test.ts`

- [ ] **Step 1: Create base adapter with shared OAuth2 helpers**

Create `packages/platform-sdk/src/adapters/base.ts`:

```typescript
import { randomBytes, createHash } from "crypto";
import type { PlatformConfig } from "../types";

export function generateState(): string {
  return randomBytes(32).toString("hex");
}

export function generatePkceVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function generatePkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildAuthorizeUrl(
  config: PlatformConfig,
  params: {
    redirectUri: string;
    state: string;
    codeChallenge?: string;
    extraParams?: Record<string, string>;
  }
): string {
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));

  if (params.codeChallenge) {
    url.searchParams.set("code_challenge", params.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }

  if (params.extraParams) {
    for (const [k, v] of Object.entries(params.extraParams)) {
      url.searchParams.set(k, v);
    }
  }

  return url.toString();
}

export async function exchangeCodeForTokens(
  config: PlatformConfig,
  params: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: params.code,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });

  if (params.codeVerifier) {
    body.set("code_verifier", params.codeVerifier);
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(
  config: PlatformConfig,
  refreshToken: string
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${error}`);
  }

  return response.json();
}
```

- [ ] **Step 2: Create Facebook adapter**

Create `packages/platform-sdk/src/adapters/facebook.ts`:

```typescript
import type {
  PlatformAdapter,
  AuthorizeParams,
  AuthorizeResult,
  CallbackParams,
  OAuthTokens,
} from "../types";
import { getPlatformConfig } from "../config";
import {
  generateState,
  buildAuthorizeUrl,
  exchangeCodeForTokens,
} from "./base";

export class FacebookAdapter implements PlatformAdapter {
  platform = "FACEBOOK" as const;
  private config = getPlatformConfig("FACEBOOK");

  async getAuthorizeUrl(params: AuthorizeParams): Promise<AuthorizeResult> {
    const state = generateState();
    const url = buildAuthorizeUrl(this.config, {
      redirectUri: params.redirectUri,
      state,
    });

    return { url, state };
  }

  async exchangeCode(params: CallbackParams): Promise<OAuthTokens> {
    // Step 1: Exchange code for short-lived token
    const data = await exchangeCodeForTokens(this.config, {
      code: params.code,
      redirectUri: params.redirectUri,
    });

    const shortLivedToken = data.access_token as string;

    // Step 2: Exchange short-lived token for long-lived token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          fb_exchange_token: shortLivedToken,
        })
    );

    if (!longLivedResponse.ok) {
      throw new Error(`Long-lived token exchange failed: ${await longLivedResponse.text()}`);
    }

    const longLivedData = (await longLivedResponse.json()) as Record<string, unknown>;
    const accessToken = longLivedData.access_token as string;
    const expiresIn = (longLivedData.expires_in as number) ?? 60 * 24 * 60 * 60; // default 60 days

    // Step 3: Get user info
    const meResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`
    );
    const me = (await meResponse.json()) as Record<string, unknown>;

    return {
      accessToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      scopes: this.config.scopes,
      platformUserId: me.id as string,
      platformAccountName: me.name as string,
    };
  }

  async refreshToken(_refreshToken: string): Promise<OAuthTokens> {
    // Facebook uses token exchange instead of refresh tokens
    // The long-lived token must be exchanged before it expires
    throw new Error("Facebook uses token exchange, not refresh tokens. User must re-authenticate.");
  }

  async revokeToken(accessToken: string): Promise<void> {
    await fetch(
      `https://graph.facebook.com/v21.0/me/permissions?access_token=${accessToken}`,
      { method: "DELETE" }
    );
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${accessToken}`
    );
    return response.ok;
  }
}
```

- [ ] **Step 3: Write Facebook adapter tests**

Create `packages/platform-sdk/__tests__/adapters/facebook.test.ts`:

```typescript
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
```

- [ ] **Step 4: Create adapter registry**

Create `packages/platform-sdk/src/adapters/index.ts`:

```typescript
import type { Platform, PlatformAdapter } from "../types";
import { FacebookAdapter } from "./facebook";

// Adapters added progressively — remaining platforms follow same pattern
const adapters: Partial<Record<Platform, () => PlatformAdapter>> = {
  FACEBOOK: () => new FacebookAdapter(),
};

export function getAdapter(platform: Platform): PlatformAdapter {
  const factory = adapters[platform];
  if (!factory) {
    throw new Error(`No adapter implemented for platform: ${platform}`);
  }
  return factory();
}

export function isAdapterAvailable(platform: Platform): boolean {
  return platform in adapters;
}
```

- [ ] **Step 5: Update barrel export**

Add to `packages/platform-sdk/src/index.ts`:

```typescript
export { getAdapter, isAdapterAvailable } from "./adapters";
export {
  generateState,
  generatePkceVerifier,
  generatePkceChallenge,
} from "./adapters/base";
```

- [ ] **Step 6: Run tests**

Run: `cd packages/platform-sdk && pnpm test`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add packages/platform-sdk
git commit -m "feat: add base OAuth helpers and Facebook adapter with tests"
```

---

### Task 4: Remaining Platform Adapters (Instagram, TikTok, LinkedIn, Twitter, YouTube, Google Ads, Pinterest, Snapchat)

**Files:**
- Create: `packages/platform-sdk/src/adapters/instagram.ts`
- Create: `packages/platform-sdk/src/adapters/tiktok.ts`
- Create: `packages/platform-sdk/src/adapters/linkedin.ts`
- Create: `packages/platform-sdk/src/adapters/twitter.ts`
- Create: `packages/platform-sdk/src/adapters/youtube.ts`
- Create: `packages/platform-sdk/src/adapters/google-ads.ts`
- Create: `packages/platform-sdk/src/adapters/pinterest.ts`
- Create: `packages/platform-sdk/src/adapters/snapchat.ts`
- Modify: `packages/platform-sdk/src/adapters/index.ts`
- Create: `packages/platform-sdk/__tests__/adapters/twitter.test.ts`

Each adapter implements the `PlatformAdapter` interface. Key differences per platform:

**Instagram** — Reuses Meta OAuth (like Facebook) but with Instagram-specific scopes. `exchangeCode` fetches Instagram Business Account ID from linked Facebook Page.

**TikTok** — Uses PKCE. Token URL requires `client_key` not `client_id`. Response uses `open_id` not standard user ID.

**LinkedIn** — Standard OAuth2. User info from `/v2/me` endpoint.

**Twitter/X** — OAuth2 + PKCE required. Uses Basic auth header (base64 client_id:client_secret) for token exchange.

**YouTube** — Google OAuth2. User info from YouTube Data API `/channels?mine=true`. MUST pass `access_type=offline` and `prompt=consent` as `extraParams` in `buildAuthorizeUrl` to get refresh token.

**Google Ads** — Same as YouTube OAuth but different scopes. MUST pass `access_type=offline` and `prompt=consent`. Needs developer token header for API calls.

**Pinterest** — Standard OAuth2. Uses Basic auth for token exchange.

**Snapchat** — Standard OAuth2. Very short token lifetime (30 min).

- [ ] **Step 1: Create all 8 adapter files**

Each follows the same pattern as FacebookAdapter. Key variations:

For **Twitter** (`twitter.ts`):
```typescript
import type { PlatformAdapter, AuthorizeParams, AuthorizeResult, CallbackParams, OAuthTokens } from "../types";
import { getPlatformConfig } from "../config";
import { generateState, generatePkceVerifier, generatePkceChallenge, buildAuthorizeUrl } from "./base";

export class TwitterAdapter implements PlatformAdapter {
  platform = "TWITTER_X" as const;
  private config = getPlatformConfig("TWITTER_X");

  async getAuthorizeUrl(params: AuthorizeParams): Promise<AuthorizeResult> {
    const state = generateState();
    const codeVerifier = generatePkceVerifier();
    const codeChallenge = generatePkceChallenge(codeVerifier);

    const url = buildAuthorizeUrl(this.config, {
      redirectUri: params.redirectUri,
      state,
      codeChallenge,
    });

    return { url, state, codeVerifier };
  }

  async exchangeCode(params: CallbackParams): Promise<OAuthTokens> {
    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    const body = new URLSearchParams({
      code: params.code,
      redirect_uri: params.redirectUri,
      grant_type: "authorization_code",
      code_verifier: params.codeVerifier!,
    });

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: body.toString(),
    });

    if (!response.ok) throw new Error(`Twitter token exchange failed: ${await response.text()}`);
    const data = (await response.json()) as Record<string, unknown>;

    // Get user info
    const meResponse = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const me = (await meResponse.json()) as { data: { id: string; name: string; username: string } };

    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string,
      expiresAt: new Date(Date.now() + (data.expires_in as number) * 1000),
      scopes: (data.scope as string).split(" "),
      platformUserId: me.data.id,
      platformAccountName: `@${me.data.username}`,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    const body = new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: body.toString(),
    });

    if (!response.ok) throw new Error(`Twitter refresh failed: ${await response.text()}`);
    const data = (await response.json()) as Record<string, unknown>;

    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string,
      expiresAt: new Date(Date.now() + (data.expires_in as number) * 1000),
      scopes: (data.scope as string).split(" "),
      platformUserId: "", // preserved from existing connection
      platformAccountName: "",
    };
  }

  async revokeToken(accessToken: string): Promise<void> {
    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    await fetch(this.config.revokeUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({ token: accessToken, token_type_hint: "access_token" }).toString(),
    });
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const response = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.ok;
  }
}
```

For remaining adapters (Instagram, TikTok, LinkedIn, YouTube, Google Ads, Pinterest, Snapchat): follow the same pattern with platform-specific URLs, auth mechanisms, and user info endpoints. Each uses `getPlatformConfig(PLATFORM)` and implements all 5 `PlatformAdapter` methods. Standard OAuth2 adapters (LinkedIn, Pinterest, Snapchat) can use the shared `exchangeCodeForTokens` and `refreshAccessToken` from `base.ts`. PKCE adapters (TikTok, Twitter) generate verifier/challenge.

- [ ] **Step 2: Write Twitter adapter tests (PKCE flow)**

Create `packages/platform-sdk/__tests__/adapters/twitter.test.ts`:

```typescript
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
```

- [ ] **Step 3: Update adapter registry with all platforms**

Update `packages/platform-sdk/src/adapters/index.ts`:

```typescript
import type { Platform, PlatformAdapter } from "../types";
import { FacebookAdapter } from "./facebook";
import { InstagramAdapter } from "./instagram";
import { TiktokAdapter } from "./tiktok";
import { LinkedinAdapter } from "./linkedin";
import { TwitterAdapter } from "./twitter";
import { YoutubeAdapter } from "./youtube";
import { GoogleAdsAdapter } from "./google-ads";
import { PinterestAdapter } from "./pinterest";
import { SnapchatAdapter } from "./snapchat";

const adapters: Record<Platform, () => PlatformAdapter> = {
  FACEBOOK: () => new FacebookAdapter(),
  INSTAGRAM: () => new InstagramAdapter(),
  TIKTOK: () => new TiktokAdapter(),
  LINKEDIN: () => new LinkedinAdapter(),
  TWITTER_X: () => new TwitterAdapter(),
  YOUTUBE: () => new YoutubeAdapter(),
  GOOGLE_ADS: () => new GoogleAdsAdapter(),
  PINTEREST: () => new PinterestAdapter(),
  SNAPCHAT: () => new SnapchatAdapter(),
};

export function getAdapter(platform: Platform): PlatformAdapter {
  const factory = adapters[platform];
  if (!factory) {
    throw new Error(`No adapter implemented for platform: ${platform}`);
  }
  return factory();
}

export function isAdapterAvailable(platform: Platform): boolean {
  return platform in adapters;
}
```

- [ ] **Step 4: Run tests**

Run: `cd packages/platform-sdk && pnpm test`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add packages/platform-sdk
git commit -m "feat: add OAuth adapters for all 9 platforms (Instagram, TikTok, LinkedIn, Twitter, YouTube, Google Ads, Pinterest, Snapchat)"
```

---

### Task 5: OAuth Authorize & Callback API Routes

**Files:**
- Create: `apps/web/src/app/api/platforms/[platform]/authorize/route.ts`
- Create: `apps/web/src/app/api/platforms/[platform]/callback/route.ts`

- [ ] **Step 1: Create authorize route**

Create `apps/web/src/app/api/platforms/[platform]/authorize/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@reachpilot/db";
import { checkPlanLimit } from "@reachpilot/shared";
import { getAdapter, type Platform } from "@reachpilot/platform-sdk";
import { encrypt } from "@reachpilot/shared";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.currentOrgId) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  const { platform } = await params;
  const platformKey = platform.toUpperCase() as Platform;

  // Check plan limit
  const org = await prisma.organization.findUnique({
    where: { id: session.user.currentOrgId },
  });
  if (!org) {
    return NextResponse.redirect(new URL("/dashboard/settings/connections?error=org_not_found", req.url));
  }

  const connectionCount = await prisma.platformConnection.count({
    where: { orgId: org.id },
  });
  const limitCheck = checkPlanLimit(org.plan, "platformConnections", {
    platformConnections: connectionCount,
    postsThisMonth: 0,
    teamMembers: 0,
  });
  if (!limitCheck.allowed) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings/connections?error=plan_limit&upgrade=${limitCheck.upgradeRequired}`, req.url)
    );
  }

  try {
    const adapter = getAdapter(platformKey);
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/${platform}/callback`;

    const result = await adapter.getAuthorizeUrl({
      orgId: session.user.currentOrgId,
      userId: session.user.id,
      redirectUri,
    });

    // Store state + PKCE verifier + context in ENCRYPTED cookie
    const cookieStore = await cookies();
    const oauthStateJson = JSON.stringify({
      state: result.state,
      codeVerifier: result.codeVerifier,
      orgId: session.user.currentOrgId,
      userId: session.user.id,
      platform: platformKey,
    });
    const encryptedState = encrypt(oauthStateJson, process.env.MASTER_ENCRYPTION_KEY!);

    cookieStore.set("reachpilot-oauth-state", encryptedState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Must be lax for OAuth redirects
      path: "/",
      maxAge: 600, // 10 minutes
    });

    return NextResponse.redirect(result.url);
  } catch (error) {
    console.error(`OAuth authorize error for ${platform}:`, error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings/connections?error=oauth_failed`, req.url)
    );
  }
}
```

- [ ] **Step 2: Create callback route**

Create `apps/web/src/app/api/platforms/[platform]/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@reachpilot/db";
import { encrypt, decrypt } from "@reachpilot/shared";
import { getAdapter, type Platform } from "@reachpilot/platform-sdk";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const platformKey = platform.toUpperCase() as Platform;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings/connections?error=${error}`, req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/settings/connections?error=missing_params", req.url)
    );
  }

  // Retrieve and DECRYPT OAuth state from cookie
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("reachpilot-oauth-state");
  if (!stateCookie?.value) {
    return NextResponse.redirect(
      new URL("/dashboard/settings/connections?error=invalid_state", req.url)
    );
  }

  let oauthState: {
    state: string;
    codeVerifier?: string;
    orgId: string;
    userId: string;
    platform: string;
  };

  try {
    const decryptedJson = decrypt(stateCookie.value, process.env.MASTER_ENCRYPTION_KEY!);
    oauthState = JSON.parse(decryptedJson);
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/settings/connections?error=invalid_state", req.url)
    );
  }

  // Validate CSRF state
  if (oauthState.state !== state || oauthState.platform !== platformKey) {
    return NextResponse.redirect(
      new URL("/dashboard/settings/connections?error=state_mismatch", req.url)
    );
  }

  // Clear the state cookie
  cookieStore.delete("reachpilot-oauth-state");

  try {
    const adapter = getAdapter(platformKey);
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/${platform}/callback`;

    const tokens = await adapter.exchangeCode({
      code,
      state,
      redirectUri,
      codeVerifier: oauthState.codeVerifier,
    });

    const masterKey = process.env.MASTER_ENCRYPTION_KEY!;

    // Upsert the platform connection
    await prisma.platformConnection.upsert({
      where: {
        orgId_platform_platformUserId: {
          orgId: oauthState.orgId,
          platform: platformKey,
          platformUserId: tokens.platformUserId,
        },
      },
      update: {
        accessToken: encrypt(tokens.accessToken, masterKey),
        refreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken, masterKey)
          : null,
        tokenExpiresAt: tokens.expiresAt,
        platformAccountName: tokens.platformAccountName,
        scopes: tokens.scopes,
        status: "ACTIVE",
        metadata: tokens.metadata ?? undefined,
      },
      create: {
        orgId: oauthState.orgId,
        platform: platformKey,
        accessToken: encrypt(tokens.accessToken, masterKey),
        refreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken, masterKey)
          : null,
        tokenExpiresAt: tokens.expiresAt,
        platformUserId: tokens.platformUserId,
        platformAccountName: tokens.platformAccountName,
        scopes: tokens.scopes,
        status: "ACTIVE",
        connectedBy: oauthState.userId,
        metadata: tokens.metadata ?? undefined,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: oauthState.orgId,
        userId: oauthState.userId,
        action: "CONNECT_PLATFORM",
        entityType: "PlatformConnection",
        entityId: tokens.platformUserId,
        after: {
          platform: platformKey,
          platformAccountName: tokens.platformAccountName,
        },
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard/settings/connections?success=connected", req.url)
    );
  } catch (error) {
    console.error(`OAuth callback error for ${platform}:`, error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings/connections?error=exchange_failed`, req.url)
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add "apps/web/src/app/api/platforms"
git commit -m "feat: add OAuth authorize and callback routes for platform connections"
```

---

### Task 6: Disconnect Route + Webhook Ingestion

**Files:**
- Create: `apps/web/src/app/api/platforms/[platform]/disconnect/route.ts`
- Create: `apps/web/src/app/api/webhooks/[platform]/route.ts`
- Create: `packages/platform-sdk/src/webhook-verifiers/meta.ts`
- Create: `packages/platform-sdk/src/webhook-verifiers/index.ts`
- Create: `packages/platform-sdk/__tests__/webhook-verifiers/meta.test.ts`

- [ ] **Step 1: Create disconnect route**

Create `apps/web/src/app/api/platforms/[platform]/disconnect/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { decrypt } from "@reachpilot/shared";
import { getAdapter, type Platform } from "@reachpilot/platform-sdk";

export const POST = withErrorHandler(withRole("ADMIN", async (req, context) => {
  const { platform } = await context.params;
  const platformKey = platform.toUpperCase() as Platform;
  const { connectionId } = await req.json();

  const connection = await prisma.platformConnection.findFirst({
    where: { id: connectionId, orgId: req.orgId, platform: platformKey },
  });

  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  // Best-effort token revocation
  try {
    const adapter = getAdapter(platformKey);
    const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
    const accessToken = decrypt(connection.accessToken, masterKey);
    await adapter.revokeToken(accessToken);
  } catch (error) {
    console.warn(`Token revocation failed for ${platform}:`, error);
    // Continue with deletion even if revocation fails
  }

  await prisma.platformConnection.delete({ where: { id: connectionId } });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "DISCONNECT_PLATFORM",
      entityType: "PlatformConnection",
      entityId: connectionId,
      before: {
        platform: platformKey,
        platformAccountName: connection.platformAccountName,
      },
    },
  });

  return NextResponse.json({ success: true });
}));
```

- [ ] **Step 2: Create Meta webhook verifier**

Create `packages/platform-sdk/src/webhook-verifiers/meta.ts`:

```typescript
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
```

Create `packages/platform-sdk/src/webhook-verifiers/index.ts`:

```typescript
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
```

- [ ] **Step 3: Write Meta webhook verifier test**

Create `packages/platform-sdk/__tests__/webhook-verifiers/meta.test.ts`:

```typescript
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
```

- [ ] **Step 4: Create generic webhook ingestion route**

Create `apps/web/src/app/api/webhooks/[platform]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@reachpilot/db";
import { getWebhookVerifier } from "@reachpilot/platform-sdk/src/webhook-verifiers";
import { createHash } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const body = await req.text();
  const signature =
    req.headers.get("x-hub-signature-256") ?? // Meta
    req.headers.get("x-signature") ?? // Generic
    "";

  // Verify signature if verifier exists
  const verifier = getWebhookVerifier(platform);
  const verified = verifier ? verifier(body, signature) : false;

  // Generate deduplication ID
  let platformEventId: string;
  try {
    const parsed = JSON.parse(body);
    platformEventId =
      parsed.id ??
      parsed.event_id ??
      createHash("sha256")
        .update(`${platform}:${body}:${signature}`)
        .digest("hex");
  } catch {
    platformEventId = createHash("sha256")
      .update(`${platform}:${body}:${signature}`)
      .digest("hex");
  }

  // Log webhook event (idempotent upsert)
  try {
    await prisma.webhookEvent.upsert({
      where: {
        platform_platformEventId: {
          platform: platform.toUpperCase(),
          platformEventId,
        },
      },
      update: {},
      create: {
        platform: platform.toUpperCase(),
        eventType: "inbound",
        platformEventId,
        payload: JSON.parse(body),
        signature,
        verified,
      },
    });
  } catch {
    // Duplicate — already processed
  }

  // Enqueue for async processing
  // Note: Import Queue from bullmq and create a queue instance at module level
  // const webhookQueue = new Queue("webhook:process", { connection: redis });
  // await webhookQueue.add("process", { platform: platform.toUpperCase(), platformEventId });

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 5: Export webhook verifiers from platform-sdk index**

Add to `packages/platform-sdk/src/index.ts`:

```typescript
export { getWebhookVerifier, verifyMetaWebhookSignature } from "./webhook-verifiers";
```

- [ ] **Step 6: Run all tests**

Run: `cd packages/platform-sdk && pnpm test`
Expected: All tests pass

- [ ] **Step 7: Commit**

```bash
git add packages/platform-sdk apps/web/src/app/api/platforms apps/web/src/app/api/webhooks
git commit -m "feat: add disconnect route, webhook ingestion, and Meta signature verification"
```

---

### Task 7: Token Refresh & Health Check Worker Processors

**Files:**
- Create: `apps/worker/src/processors/token-refresh.ts`
- Create: `apps/worker/src/processors/token-health-check.ts`
- Modify: `apps/worker/src/index.ts`

- [ ] **Step 1: Create token refresh processor**

Create `apps/worker/src/processors/token-refresh.ts`:

```typescript
import type { Job } from "bullmq";
import { prisma } from "@reachpilot/db";
import { encrypt, decrypt } from "@reachpilot/shared";
import { getAdapter } from "@reachpilot/platform-sdk";
import type { Platform } from "@reachpilot/platform-sdk";

const PROACTIVE_REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function processTokenRefresh(job: Job): Promise<void> {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY!;

  // Find connections with tokens expiring within 7 days
  const expiryThreshold = new Date(Date.now() + PROACTIVE_REFRESH_MS);
  const connections = await prisma.platformConnection.findMany({
    where: {
      status: "ACTIVE",
      refreshToken: { not: null },
      tokenExpiresAt: { lt: expiryThreshold },
    },
  });

  console.log(`[token:refresh] Found ${connections.length} connections to refresh`);

  for (const conn of connections) {
    try {
      if (!conn.refreshToken) continue;

      const adapter = getAdapter(conn.platform as Platform);
      const decryptedRefreshToken = decrypt(conn.refreshToken, masterKey);

      const newTokens = await adapter.refreshToken(decryptedRefreshToken);

      await prisma.platformConnection.update({
        where: { id: conn.id },
        data: {
          accessToken: encrypt(newTokens.accessToken, masterKey),
          refreshToken: newTokens.refreshToken
            ? encrypt(newTokens.refreshToken, masterKey)
            : conn.refreshToken,
          tokenExpiresAt: newTokens.expiresAt,
          status: "ACTIVE",
        },
      });

      await prisma.auditLog.create({
        data: {
          orgId: conn.orgId,
          action: "TOKEN_REFRESHED",
          entityType: "PlatformConnection",
          entityId: conn.id,
          after: { platform: conn.platform },
        },
      });

      console.log(`[token:refresh] Refreshed ${conn.platform} for org ${conn.orgId}`);
    } catch (error) {
      console.error(`[token:refresh] Failed for ${conn.platform} (${conn.id}):`, error);

      // Mark as expired
      await prisma.platformConnection.update({
        where: { id: conn.id },
        data: { status: "EXPIRED" },
      });

      await prisma.auditLog.create({
        data: {
          orgId: conn.orgId,
          action: "TOKEN_REFRESH_FAILED",
          entityType: "PlatformConnection",
          entityId: conn.id,
          after: { platform: conn.platform, error: String(error) },
        },
      });

      // Enqueue notification email
      // const emailQueue = new Queue("email:send", { connection });
      // await emailQueue.add("token-expired", {
      //   orgId: conn.orgId,
      //   platform: conn.platform,
      //   platformAccountName: conn.platformAccountName,
      // });
    }
  }
}
```

- [ ] **Step 2: Create token health check processor**

Create `apps/worker/src/processors/token-health-check.ts`:

```typescript
import type { Job } from "bullmq";
import { prisma } from "@reachpilot/db";
import { decrypt } from "@reachpilot/shared";
import { getAdapter } from "@reachpilot/platform-sdk";
import type { Platform } from "@reachpilot/platform-sdk";

export async function processTokenHealthCheck(job: Job): Promise<void> {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY!;

  const connections = await prisma.platformConnection.findMany({
    where: { status: "ACTIVE" },
  });

  console.log(`[token:health-check] Checking ${connections.length} active connections`);

  for (const conn of connections) {
    try {
      const adapter = getAdapter(conn.platform as Platform);
      const accessToken = decrypt(conn.accessToken, masterKey);
      const isValid = await adapter.validateToken(accessToken);

      if (!isValid) {
        console.warn(`[token:health-check] Invalid token for ${conn.platform} (${conn.id})`);

        await prisma.platformConnection.update({
          where: { id: conn.id },
          data: { status: "EXPIRED" },
        });

        await prisma.auditLog.create({
          data: {
            orgId: conn.orgId,
            action: "TOKEN_INVALID",
            entityType: "PlatformConnection",
            entityId: conn.id,
            after: { platform: conn.platform },
          },
        });
      }
    } catch (error) {
      console.error(`[token:health-check] Error checking ${conn.platform} (${conn.id}):`, error);
    }
  }
}
```

- [ ] **Step 3: Update worker index to use real processors**

Update `apps/worker/src/index.ts` — replace the two placeholder processors for `token:refresh` and `token:health-check` with the real ones:

Add imports at top:
```typescript
import { processTokenRefresh } from "./processors/token-refresh";
import { processTokenHealthCheck } from "./processors/token-health-check";
```

Replace in the workers array:
```typescript
createWorker("token:refresh", processTokenRefresh, 2),
createWorker("token:health-check", processTokenHealthCheck, 2),
```

- [ ] **Step 4: Commit**

```bash
git add apps/worker/src
git commit -m "feat: add token refresh and health check worker processors"
```

---

### Task 8: Connections Management UI

**Files:**
- Modify: `apps/web/src/app/(dashboard)/settings/connections/page.tsx`

- [ ] **Step 1: Replace stub connections page with full UI**

Replace `apps/web/src/app/(dashboard)/settings/connections/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@reachpilot/db";
import { PLATFORM_CONFIGS } from "@reachpilot/platform-sdk";
import type { Platform } from "@reachpilot/platform-sdk";

const PLATFORM_ORDER: Platform[] = [
  "FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X",
  "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT",
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-yellow-100 text-yellow-800",
  REVOKED: "bg-red-100 text-red-800",
};

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.currentOrgId) {
    redirect("/org-picker");
  }

  const params = await searchParams;
  const orgId = session.user.currentOrgId;

  const connections = await prisma.platformConnection.findMany({
    where: { orgId },
  });

  const connectionMap = new Map(
    connections.map((c) => [c.platform, c])
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Platform Connections</h1>
      <p className="text-gray-500 mb-6">
        Connect your social media accounts to manage campaigns.
      </p>

      {params.success === "connected" && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          Platform connected successfully!
        </div>
      )}

      {params.error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          Connection failed: {params.error.replace(/_/g, " ")}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORM_ORDER.map((platform) => {
          const config = PLATFORM_CONFIGS[platform];
          const connection = connectionMap.get(platform);

          return (
            <div
              key={platform}
              className="border rounded-lg p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{config.displayName}</h3>
                  {connection && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[connection.status]}`}
                    >
                      {connection.status}
                    </span>
                  )}
                </div>
                {connection && (
                  <p className="text-sm text-gray-500">
                    {connection.platformAccountName ?? connection.platformUserId}
                  </p>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {!connection ? (
                  <a
                    href={`/api/platforms/${platform}/authorize`}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Connect
                  </a>
                ) : connection.status === "EXPIRED" ? (
                  <a
                    href={`/api/platforms/${platform}/authorize`}
                    className="inline-flex items-center rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-700"
                  >
                    Reconnect
                  </a>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await fetch(
                        `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/${platform}/disconnect`,
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ connectionId: connection.id }),
                        }
                      );
                      const { redirect: redir } = await import("next/navigation");
                      redir("/dashboard/settings/connections");
                    }}
                  >
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Disconnect
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/app/(dashboard)/settings/connections/page.tsx"
git commit -m "feat: add platform connections management UI with connect/disconnect actions"
```

---

### Task 9: PlatformClient (Unified API Client with Lazy Token Refresh)

**Files:**
- Create: `packages/platform-sdk/src/client.ts`

This is the Layer 1 lazy-refresh mechanism from the spec. The PlatformClient wraps platform API calls with automatic token refresh when tokens are expiring.

- [ ] **Step 1: Create PlatformClient**

Create `packages/platform-sdk/src/client.ts`:

```typescript
import { prisma } from "@reachpilot/db";
import { encrypt, decrypt } from "@reachpilot/shared";
import { getAdapter } from "./adapters";
import { TokenManager } from "./token-manager";
import type { Platform, OAuthTokens } from "./types";

export class PlatformClient {
  private tokenManager: TokenManager;

  constructor(private masterKey: string) {
    this.tokenManager = new TokenManager(masterKey);
  }

  /**
   * Get a valid access token for a platform connection.
   * Performs lazy refresh if token is expired or expiring within 5 minutes.
   * Returns the decrypted access token ready for API calls.
   */
  async getAccessToken(connectionId: string): Promise<string> {
    const connection = await prisma.platformConnection.findUniqueOrThrow({
      where: { id: connectionId },
    });

    if (connection.status !== "ACTIVE") {
      throw new Error(`Connection ${connectionId} is ${connection.status}`);
    }

    const accessToken = this.tokenManager.decryptToken(connection.accessToken);

    // If token is not expiring, return it directly
    if (!this.tokenManager.isTokenExpiring(connection.tokenExpiresAt)) {
      return accessToken;
    }

    // Token is expiring — attempt lazy refresh
    if (!connection.refreshToken) {
      throw new Error(
        `Token expired for ${connection.platform} and no refresh token available. User must re-authenticate.`
      );
    }

    const refreshToken = this.tokenManager.decryptToken(connection.refreshToken);
    const adapter = getAdapter(connection.platform as Platform);

    try {
      const newTokens = await adapter.refreshToken(refreshToken);

      // Update connection with new tokens
      await prisma.platformConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: this.tokenManager.encryptToken(newTokens.accessToken),
          refreshToken: newTokens.refreshToken
            ? this.tokenManager.encryptToken(newTokens.refreshToken)
            : connection.refreshToken,
          tokenExpiresAt: newTokens.expiresAt,
          status: "ACTIVE",
        },
      });

      await prisma.auditLog.create({
        data: {
          orgId: connection.orgId,
          action: "TOKEN_LAZY_REFRESHED",
          entityType: "PlatformConnection",
          entityId: connectionId,
          after: { platform: connection.platform },
        },
      });

      return newTokens.accessToken;
    } catch (error) {
      // Mark as expired on refresh failure
      await prisma.platformConnection.update({
        where: { id: connectionId },
        data: { status: "EXPIRED" },
      });

      throw new Error(
        `Lazy token refresh failed for ${connection.platform}: ${error}`
      );
    }
  }
}
```

- [ ] **Step 2: Export from index**

Add to `packages/platform-sdk/src/index.ts`:

```typescript
export { PlatformClient } from "./client";
```

- [ ] **Step 3: Commit**

```bash
git add packages/platform-sdk/src/client.ts packages/platform-sdk/src/index.ts
git commit -m "feat: add PlatformClient with lazy token refresh for platform API calls"
```

---

### Task 10: Final Verification & Test Run

- [ ] **Step 1: Install all dependencies**

Run: `cd /d/Claude/Projects/aimarketing && pnpm install`

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: All tests pass across packages/shared (23), packages/platform-sdk (new), apps/web (5)

- [ ] **Step 3: Verify file structure**

```bash
find packages/platform-sdk/src -name "*.ts" | sort
```

Expected: types.ts, config.ts, token-manager.ts, client.ts, index.ts, adapters/*.ts (9 + base + index), webhook-verifiers/*.ts (meta + index)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Phase 2 Platform Connections complete — 9 OAuth adapters, token management, connection UI"
```

---

## Summary

**10 tasks, ~55 steps.** After completion, Phase 2 delivers:

- `packages/platform-sdk` — fully implemented with:
  - `PlatformAdapter` interface + `PlatformConfig` for all 9 platforms
  - `TokenManager` with encrypt/decrypt + expiry checking (tested)
  - 9 OAuth adapters (Facebook, Instagram, TikTok, LinkedIn, Twitter/X, YouTube, Google Ads, Pinterest, Snapchat)
  - `PlatformClient` with lazy token refresh (Layer 1 strategy from spec)
  - Base OAuth2 helpers (PKCE, state generation, token exchange)
  - Meta webhook signature verification (tested)
  - Adapter registry for dynamic platform lookup
- OAuth authorize + callback API routes with plan limit checks
- Platform disconnect route with token revocation + audit logging
- Generic webhook ingestion route with idempotent deduplication
- Token refresh + health check worker processors (BullMQ)
- Full connections management UI (9 platform cards, connect/disconnect/reconnect)

**Next:** Phase 3 — Campaign Engine (BullMQ queues, campaign CRUD, post scheduling, publish pipeline)
