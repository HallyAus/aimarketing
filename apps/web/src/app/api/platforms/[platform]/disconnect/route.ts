import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { decrypt } from "@adpilot/shared";
import { getAdapter, type Platform } from "@adpilot/platform-sdk";

export const POST = withErrorHandler(withRole("ADMIN", async (req, context) => {
  const platform = (await context.params).platform!;
  const platformKey = platform.toUpperCase() as Platform;
  const { connectionId } = await req.json();

  const connection = await prisma.platformConnection.findFirst({
    where: { id: connectionId, orgId: req.orgId, platform: platformKey },
  });

  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  // Best-effort token revocation
  try {
    const adapter = getAdapter(platformKey);
    const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
    const accessToken = decrypt(connection.accessToken, masterKey);
    await adapter.revokeToken(accessToken);
  } catch (error) {
    console.warn(`Token revocation failed for ${platform}:`, error);
    // Continue with deletion even if revocation fails
  }

  await prisma.platformConnection.delete({ where: { id: connectionId } });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "DISCONNECT_PLATFORM",
      entityType: "PlatformConnection",
      entityId: connectionId,
      before: {
        platform: platformKey,
        platformAccountName: connection.platformAccountName,
      },
    },
  });

  return NextResponse.json({ success: true });
}));
