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
      expiresAt: new Date(Date.now() + ((data.expires_in as number) ?? 7200) * 1000),
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
      expiresAt: new Date(Date.now() + ((data.expires_in as number) ?? 7200) * 1000),
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
