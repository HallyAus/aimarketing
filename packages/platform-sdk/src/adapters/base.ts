import { randomBytes, createHash } from "crypto";
import type { PlatformConfig } from "../types";

export function generateState(): string {
  return randomBytes(32).toString("hex");
}

export function generatePkceVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function generatePkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildAuthorizeUrl(
  config: PlatformConfig,
  params: {
    redirectUri: string;
    state: string;
    codeChallenge?: string;
    extraParams?: Record<string, string>;
  }
): string {
  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));

  if (params.codeChallenge) {
    url.searchParams.set("code_challenge", params.codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }

  if (params.extraParams) {
    for (const [k, v] of Object.entries(params.extraParams)) {
      url.searchParams.set(k, v);
    }
  }

  return url.toString();
}

export async function exchangeCodeForTokens(
  config: PlatformConfig,
  params: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: params.code,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });

  if (params.codeVerifier) {
    body.set("code_verifier", params.codeVerifier);
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(
  config: PlatformConfig,
  refreshToken: string
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${error}`);
  }

  return response.json();
}
