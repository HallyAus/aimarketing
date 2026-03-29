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
