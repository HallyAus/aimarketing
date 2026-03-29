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
  refreshAccessToken,
} from "./base";

export class PinterestAdapter implements PlatformAdapter {
  platform = "PINTEREST" as const;
  private config = getPlatformConfig("PINTEREST");

  async getAuthorizeUrl(params: AuthorizeParams): Promise<AuthorizeResult> {
    const state = generateState();
    const url = buildAuthorizeUrl(this.config, {
      redirectUri: params.redirectUri,
      state,
    });

    return { url, state };
  }

  async exchangeCode(params: CallbackParams): Promise<OAuthTokens> {
    // Pinterest uses Basic auth for token exchange (like Twitter)
    const credentials = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    const body = new URLSearchParams({
      code: params.code,
      redirect_uri: params.redirectUri,
      grant_type: "authorization_code",
    });

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`Pinterest token exchange failed: ${await response.text()}`);
    }

    const data = (await response.json()) as Record<string, unknown>;
    const accessToken = data.access_token as string;
    const expiresIn = (data.expires_in as number) ?? this.config.tokenExpirySeconds ?? 3600;

    // Get user info from Pinterest
    let platformUserId = "";
    let platformAccountName: string | undefined;

    try {
      const userResponse = await fetch("https://api.pinterest.com/v5/user_account", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (userResponse.ok) {
        const userData = (await userResponse.json()) as Record<string, unknown>;
        platformUserId = userData.username as string ?? "";
        platformAccountName = userData.username as string | undefined;
      }
    } catch {
      // Non-critical
    }

    return {
      accessToken,
      refreshToken: data.refresh_token as string | undefined,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      scopes: this.config.scopes,
      platformUserId,
      platformAccountName,
    };
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const data = await refreshAccessToken(this.config, refreshToken);

    return {
      accessToken: data.access_token as string,
      refreshToken: (data.refresh_token as string | undefined) ?? refreshToken,
      expiresAt: new Date(
        Date.now() + ((data.expires_in as number) ?? this.config.tokenExpirySeconds ?? 3600) * 1000
      ),
      scopes: this.config.scopes,
      platformUserId: "", // preserved from existing connection
      platformAccountName: "",
    };
  }

  async revokeToken(_accessToken: string): Promise<void> {
    // Pinterest does not have a dedicated token revocation endpoint in v5
    // Revocation is handled through app settings
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const response = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.ok;
  }
}
