import { prisma } from "@adpilot/db";
import { encrypt, decrypt } from "@adpilot/shared";
import { getAdapter } from "./adapters";
import { TokenManager } from "./token-manager";
import type { Platform, OAuthTokens } from "./types";

export class PlatformClient {
  private tokenManager: TokenManager;

  constructor(private masterKey: string) {
    this.tokenManager = new TokenManager(masterKey);
  }

  /**
   * Get a valid access token for a platform connection.
   * Performs lazy refresh if token is expired or expiring within 5 minutes.
   * Returns the decrypted access token ready for API calls.
   */
  async getAccessToken(connectionId: string): Promise<string> {
    const connection = await prisma.platformConnection.findUniqueOrThrow({
      where: { id: connectionId },
    });

    if (connection.status !== "ACTIVE") {
      throw new Error(`Connection ${connectionId} is ${connection.status}`);
    }

    const accessToken = this.tokenManager.decryptToken(connection.accessToken);

    // If token is not expiring, return it directly
    if (!this.tokenManager.isTokenExpiring(connection.tokenExpiresAt)) {
      return accessToken;
    }

    // Token is expiring — attempt lazy refresh
    if (!connection.refreshToken) {
      throw new Error(
        `Token expired for ${connection.platform} and no refresh token available. User must re-authenticate.`
      );
    }

    const refreshToken = this.tokenManager.decryptToken(connection.refreshToken);
    const adapter = getAdapter(connection.platform as Platform);

    try {
      const newTokens = await adapter.refreshToken(refreshToken);

      // Update connection with new tokens
      await prisma.platformConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: this.tokenManager.encryptToken(newTokens.accessToken),
          refreshToken: newTokens.refreshToken
            ? this.tokenManager.encryptToken(newTokens.refreshToken)
            : connection.refreshToken,
          tokenExpiresAt: newTokens.expiresAt,
          status: "ACTIVE",
        },
      });

      await prisma.auditLog.create({
        data: {
          orgId: connection.orgId,
          action: "TOKEN_LAZY_REFRESHED",
          entityType: "PlatformConnection",
          entityId: connectionId,
          after: { platform: connection.platform },
        },
      });

      return newTokens.accessToken;
    } catch (error) {
      // Mark as expired on refresh failure
      await prisma.platformConnection.update({
        where: { id: connectionId },
        data: { status: "EXPIRED" },
      });

      throw new Error(
        `Lazy token refresh failed for ${connection.platform}: ${error}`
      );
    }
  }
}
