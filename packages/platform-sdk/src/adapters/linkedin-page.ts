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

interface LinkedInOrg {
  organizationalTarget: string;
  role: string;
  state: string;
}

interface LinkedInOrgDetails {
  localizedName?: string;
}

/**
 * LinkedIn Page (Company) adapter.
 *
 * Uses the Community Management API with organization scopes.
 * After connecting, fetches the user's administered organizations
 * and stores them as metadata for page selection.
 */
export class LinkedinPageAdapter implements PlatformAdapter {
  platform = "LINKEDIN_PAGE" as const;
  private config = getPlatformConfig("LINKEDIN_PAGE");

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

    // Get the user's member ID via /v2/me
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

    // Fetch organizations the user administers
    const orgs = await this.fetchAdministeredOrgs(accessToken);

    return {
      accessToken,
      refreshToken: data.refresh_token as string | undefined,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      scopes: this.config.scopes,
      platformUserId,
      platformAccountName,
      metadata: { organizations: orgs },
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
      platformUserId: "",
      platformAccountName: "",
    };
  }

  async revokeToken(_accessToken: string): Promise<void> {
    // LinkedIn does not provide a programmatic revoke endpoint
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

  /**
   * Fetch organizations the authenticated user is an ADMINISTRATOR of.
   */
  private async fetchAdministeredOrgs(
    accessToken: string
  ): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await fetch(
        "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget))",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      if (!response.ok) return [];

      const data = (await response.json()) as { elements?: LinkedInOrg[] };
      const elements = data.elements ?? [];

      // Extract org IDs and fetch names
      const orgs: Array<{ id: string; name: string }> = [];
      for (const el of elements) {
        const orgUrn = el.organizationalTarget;
        const orgId = orgUrn.split(":").pop() ?? "";
        if (!orgId) continue;

        const orgRes = await fetch(
          `https://api.linkedin.com/v2/organizations/${orgId}?projection=(localizedName)`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        );

        if (orgRes.ok) {
          const orgData = (await orgRes.json()) as LinkedInOrgDetails;
          orgs.push({ id: orgId, name: orgData.localizedName ?? `Org ${orgId}` });
        }
      }

      return orgs;
    } catch {
      return [];
    }
  }
}
