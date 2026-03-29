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

export class GoogleAdsAdapter implements PlatformAdapter {
  platform = "GOOGLE_ADS" as const;
  private config = getPlatformConfig("GOOGLE_ADS");

  async getAuthorizeUrl(params: AuthorizeParams): Promise<AuthorizeResult> {
    const state = generateState();
    // MUST pass access_type=offline and prompt=consent to receive refresh token
    const url = buildAuthorizeUrl(this.config, {
      redirectUri: params.redirectUri,
      state,
      extraParams: {
        access_type: "offline",
        prompt: "consent",
      },
    });

    return { url, state };
  }

  async exchangeCode(params: CallbackParams): Promise<OAuthTokens> {
    const data = await exchangeCodeForTokens(this.config, {
      code: params.code,
      redirectUri: params.redirectUri,
    });

    const accessToken = data.access_token as string;
    const expiresIn = (data.expires_in as number) ?? this.config.tokenExpirySeconds ?? 3600;

    // Get user info from Google userinfo endpoint
    let platformUserId = "";
    let platformAccountName: string | undefined;

    try {
      const userResponse = await fetch(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (userResponse.ok) {
        const userData = (await userResponse.json()) as Record<string, unknown>;
        platformUserId = userData.id as string ?? userData.sub as string ?? "";
        platformAccountName = userData.name as string | undefined ?? userData.email as string | undefined;
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

  async revokeToken(accessToken: string): Promise<void> {
    await fetch(
      `${this.config.revokeUrl!}?token=${accessToken}`,
      { method: "POST" }
    );
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const response = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response.ok;
  }
}
