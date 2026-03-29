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
