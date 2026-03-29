import type { Job } from "bullmq";
import { prisma } from "@adpilot/db";
import { decrypt } from "@adpilot/shared";
import { getAdapter } from "@adpilot/platform-sdk";
import type { Platform } from "@adpilot/platform-sdk";

export async function processTokenHealthCheck(job: Job): Promise<void> {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY!;

  const connections = await prisma.platformConnection.findMany({
    where: { status: "ACTIVE" },
  });

  console.log(`[token:health-check] Checking ${connections.length} active connections`);

  for (const conn of connections) {
    try {
      const adapter = getAdapter(conn.platform as Platform);
      const accessToken = decrypt(conn.accessToken, masterKey);
      const isValid = await adapter.validateToken(accessToken);

      if (!isValid) {
        console.warn(`[token:health-check] Invalid token for ${conn.platform} (${conn.id})`);

        await prisma.platformConnection.update({
          where: { id: conn.id },
          data: { status: "EXPIRED" },
        });

        await prisma.auditLog.create({
          data: {
            orgId: conn.orgId,
            action: "TOKEN_INVALID",
            entityType: "PlatformConnection",
            entityId: conn.id,
            after: { platform: conn.platform },
          },
        });
      }
    } catch (error) {
      console.error(`[token:health-check] Error checking ${conn.platform} (${conn.id}):`, error);
    }
  }
}
