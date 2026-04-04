import type { Platform, PlatformConfig } from "./types";

// env() reads at call time so vi.stubEnv works in tests
function env(key: string): string {
  return process.env[key] ?? "";
}

// Lazily-evaluated configs — each property is a getter so env vars are read at access time
function buildConfigs(): Record<Platform, PlatformConfig> {
  return {
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
      "openid",
      "profile",
      "w_member_social",
    ],
    tokenExpirySeconds: 60 * 60 * 24 * 60, // 60 days
    refreshTokenExpiryDays: undefined, // No refresh tokens with 3-legged OAuth
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
}

// Lazy proxy — reads env vars at access time rather than at import time
export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = new Proxy(
  {} as Record<Platform, PlatformConfig>,
  {
    get(_target, prop: string) {
      const configs = buildConfigs();
      return configs[prop as Platform];
    },
    ownKeys() {
      return Object.keys(buildConfigs());
    },
    getOwnPropertyDescriptor(_target, prop: string) {
      const configs = buildConfigs();
      if (prop in configs) {
        return { configurable: true, enumerable: true, value: configs[prop as Platform] };
      }
      return undefined;
    },
    has(_target, prop: string) {
      return prop in buildConfigs();
    },
  }
);

export function getPlatformConfig(platform: Platform): PlatformConfig {
  // Rebuild at call time so env stubs applied in tests are picked up
  const configs = buildConfigs();
  const config = configs[platform];
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return config;
}
