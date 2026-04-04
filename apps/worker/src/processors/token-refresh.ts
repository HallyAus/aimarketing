import type { Job } from "bullmq";
import { prisma } from "@reachpilot/db";
import { encrypt, decrypt } from "@reachpilot/shared";
import { getAdapter } from "@reachpilot/platform-sdk";
import type { Platform } from "@reachpilot/platform-sdk";

const PROACTIVE_REFRESH_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function processTokenRefresh(job: Job): Promise<void> {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY!;

  // Find connections with tokens expiring within 7 days
  const expiryThreshold = new Date(Date.now() + PROACTIVE_REFRESH_MS);
  const connections = await prisma.platformConnection.findMany({
    where: {
      status: "ACTIVE",
      refreshToken: { not: null },
      tokenExpiresAt: { lt: expiryThreshold },
    },
  });

  console.log(`[token:refresh] Found ${connections.length} connections to refresh`);

  for (const conn of connections) {
    try {
      if (!conn.refreshToken) continue;

      const adapter = getAdapter(conn.platform as Platform);
      const decryptedRefreshToken = decrypt(conn.refreshToken, masterKey);

      const newTokens = await adapter.refreshToken(decryptedRefreshToken);

      await prisma.platformConnection.update({
        where: { id: conn.id },
        data: {
          accessToken: encrypt(newTokens.accessToken, masterKey),
          refreshToken: newTokens.refreshToken
            ? encrypt(newTokens.refreshToken, masterKey)
            : conn.refreshToken,
          tokenExpiresAt: newTokens.expiresAt,
          status: "ACTIVE",
        },
      });

      await prisma.auditLog.create({
        data: {
          orgId: conn.orgId,
          action: "TOKEN_REFRESHED",
          entityType: "PlatformConnection",
          entityId: conn.id,
          after: { platform: conn.platform },
        },
      });

      console.log(`[token:refresh] Refreshed ${conn.platform} for org ${conn.orgId}`);
    } catch (error) {
      console.error(`[token:refresh] Failed for ${conn.platform} (${conn.id}):`, error);

      // Mark as expired
      await prisma.platformConnection.update({
        where: { id: conn.id },
        data: { status: "EXPIRED" },
      });

      await prisma.auditLog.create({
        data: {
          orgId: conn.orgId,
          action: "TOKEN_REFRESH_FAILED",
          entityType: "PlatformConnection",
          entityId: conn.id,
          after: { platform: conn.platform, error: String(error) },
        },
      });

      // Enqueue notification email
      // const emailQueue = new Queue("email:send", { connection });
      // await emailQueue.add("token-expired", {
      //   orgId: conn.orgId,
      //   platform: conn.platform,
      //   platformAccountName: conn.platformAccountName,
      // });
    }
  }
}
