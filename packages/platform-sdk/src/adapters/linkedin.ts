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
  refreshAccessToken,
} from "./base";

export class LinkedinAdapter implements PlatformAdapter {
  platform = "LINKEDIN" as const;
  private config = getPlatformConfig("LINKEDIN");

  async getAuthorizeUrl(params: AuthorizeParams): Promise<AuthorizeResult> {
    const state = generateState();
    const url = buildAuthorizeUrl(this.config, {
      redirectUri: params.redirectUri,
      state,
    });

    return { url, state };
  }

  async exchangeCode(params: CallbackParams): Promise<OAuthTokens> {
    const data = await exchangeCodeForTokens(this.config, {
      code: params.code,
      redirectUri: params.redirectUri,
    });

    const accessToken = data.access_token as string;
    const expiresIn = (data.expires_in as number) ?? this.config.tokenExpirySeconds ?? 5184000;

    // Get user info from LinkedIn v2/me endpoint
    const meResponse = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    let platformUserId = "";
    let platformAccountName: string | undefined;

    if (meResponse.ok) {
      const me = (await meResponse.json()) as Record<string, unknown>;
      platformUserId = (me.id as string) ?? "";
      const firstName = (me.localizedFirstName as string) ?? "";
      const lastName = (me.localizedLastName as string) ?? "";
      platformAccountName = `${firstName} ${lastName}`.trim() || undefined;
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
      refreshToken: data.refresh_token as string | undefined,
      expiresAt: new Date(
        Date.now() + ((data.expires_in as number) ?? this.config.tokenExpirySeconds ?? 5184000) * 1000
      ),
      scopes: this.config.scopes,
      platformUserId: "", // preserved from existing connection
      platformAccountName: "",
    };
  }

  async revokeToken(_accessToken: string): Promise<void> {
    // LinkedIn does not provide a programmatic revoke endpoint for OAuth2
    // Token revocation is done through the developer portal
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const response = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });
    return response.ok;
  }
}
