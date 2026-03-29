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

export class InstagramAdapter implements PlatformAdapter {
  platform = "INSTAGRAM" as const;
  private config = getPlatformConfig("INSTAGRAM");

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
    const expiresIn = (longLivedData.expires_in as number) ?? 60 * 24 * 60 * 60;

    // Step 3: Fetch linked Facebook Pages
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`
    );
    const accountsData = (await accountsResponse.json()) as {
      data?: Array<{ id: string; name: string; instagram_business_account?: { id: string } }>;
    };

    // Step 4: Find Instagram Business Account ID via linked page
    let instagramAccountId: string | undefined;
    let instagramAccountName: string | undefined;

    if (accountsData.data && accountsData.data.length > 0) {
      for (const page of accountsData.data) {
        const igResponse = await fetch(
          `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`
        );
        const igData = (await igResponse.json()) as {
          instagram_business_account?: { id: string };
        };

        if (igData.instagram_business_account?.id) {
          instagramAccountId = igData.instagram_business_account.id;
          // Get Instagram account name
          const igInfoResponse = await fetch(
            `https://graph.facebook.com/v21.0/${instagramAccountId}?fields=username,name&access_token=${accessToken}`
          );
          const igInfo = (await igInfoResponse.json()) as Record<string, unknown>;
          instagramAccountName = (igInfo.username as string) ?? (igInfo.name as string);
          break;
        }
      }
    }

    // Fallback: use Facebook user info
    if (!instagramAccountId) {
      const meResponse = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`
      );
      const me = (await meResponse.json()) as Record<string, unknown>;
      instagramAccountId = me.id as string;
      instagramAccountName = me.name as string;
    }

    return {
      accessToken,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      scopes: this.config.scopes,
      platformUserId: instagramAccountId!,
      platformAccountName: instagramAccountName,
    };
  }

  async refreshToken(_refreshToken: string): Promise<OAuthTokens> {
    throw new Error("Instagram uses token exchange, not refresh tokens. User must re-authenticate.");
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
