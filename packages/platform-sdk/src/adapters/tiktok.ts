import type {
  PlatformAdapter,
  AuthorizeParams,
  AuthorizeResult,
  CallbackParams,
  OAuthTokens,
} from "../types";
import { getPlatformConfig } from "../config";
import { generateState, generatePkceVerifier, generatePkceChallenge } from "./base";

export class TiktokAdapter implements PlatformAdapter {
  platform = "TIKTOK" as const;
  private config = getPlatformConfig("TIKTOK");

  async getAuthorizeUrl(params: AuthorizeParams): Promise<AuthorizeResult> {
    const state = generateState();
    const codeVerifier = generatePkceVerifier();
    const codeChallenge = generatePkceChallenge(codeVerifier);

    // TikTok uses comma-separated scopes, not space-separated
    const url = new URL(this.config.authorizeUrl);
    url.searchParams.set("client_key", this.config.clientId); // TikTok uses client_key not client_id
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", this.config.scopes.join(","));
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");

    return { url: url.toString(), state, codeVerifier };
  }

  async exchangeCode(params: CallbackParams): Promise<OAuthTokens> {
    // TikTok token exchange uses client_key instead of client_id
    const body = new URLSearchParams({
      client_key: this.config.clientId,
      client_secret: this.config.clientSecret,
      code: params.code,
      redirect_uri: params.redirectUri,
      grant_type: "authorization_code",
      code_verifier: params.codeVerifier!,
    });

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`TikTok token exchange failed: ${await response.text()}`);
    }

    const json = (await response.json()) as Record<string, unknown>;
    // TikTok wraps response in a data object
    const data = (json.data ?? json) as Record<string, unknown>;

    const accessToken = data.access_token as string;
    const expiresIn = (data.expires_in as number) ?? this.config.tokenExpirySeconds ?? 86400;
    // TikTok uses open_id instead of standard user ID
    const openId = data.open_id as string;

    // Get user display name
    let displayName: string | undefined;
    try {
      const userResponse = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (userResponse.ok) {
        const userData = (await userResponse.json()) as {
          data?: { user?: { display_name?: string } };
        };
        displayName = userData.data?.user?.display_name;
      }
    } catch {
      // Non-critical
    }

    return {
      accessToken,
      refreshToken: data.refresh_token as string | undefined,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      scopes: this.config.scopes,
      platformUserId: openId,
      platformAccountName: displayName,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const body = new URLSearchParams({
      client_key: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`TikTok token refresh failed: ${await response.text()}`);
    }

    const json = (await response.json()) as Record<string, unknown>;
    const data = (json.data ?? json) as Record<string, unknown>;

    return {
      accessToken: data.access_token as string,
      refreshToken: data.refresh_token as string | undefined,
      expiresAt: new Date(Date.now() + ((data.expires_in as number) ?? 86400) * 1000),
      scopes: this.config.scopes,
      platformUserId: data.open_id as string ?? "",
      platformAccountName: "",
    };
  }

  async revokeToken(accessToken: string): Promise<void> {
    const body = new URLSearchParams({
      client_key: this.config.clientId,
      client_secret: this.config.clientSecret,
      token: accessToken,
    });

    await fetch(this.config.revokeUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const response = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=display_name",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.ok;
  }
}
