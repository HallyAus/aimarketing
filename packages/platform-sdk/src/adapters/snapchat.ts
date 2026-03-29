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

export class SnapchatAdapter implements PlatformAdapter {
  platform = "SNAPCHAT" as const;
  private config = getPlatformConfig("SNAPCHAT");

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
    // Snapchat tokens are very short-lived (30 min)
    const expiresIn = (data.expires_in as number) ?? this.config.tokenExpirySeconds ?? 1800;

    // Get user info from Snapchat Ads API
    let platformUserId = "";
    let platformAccountName: string | undefined;

    try {
      const meResponse = await fetch("https://adsapi.snapchat.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (meResponse.ok) {
        const meData = (await meResponse.json()) as {
          me?: { id?: string; display_name?: string; email?: string };
        };
        platformUserId = meData.me?.id ?? "";
        platformAccountName = meData.me?.display_name ?? meData.me?.email;
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
        Date.now() + ((data.expires_in as number) ?? this.config.tokenExpirySeconds ?? 1800) * 1000
      ),
      scopes: this.config.scopes,
      platformUserId: "", // preserved from existing connection
      platformAccountName: "",
    };
  }

  async revokeToken(_accessToken: string): Promise<void> {
    // Snapchat does not provide a dedicated token revocation endpoint
    // Tokens expire automatically after 30 minutes
  }

  async validateToken(accessToken: string): Promise<boolean> {
    const response = await fetch("https://adsapi.snapchat.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.ok;
  }
}
