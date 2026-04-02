import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Platform } from "@/lib/db";
import { getWebhookVerifier } from "@adpilot/platform-sdk";
import { createHash } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const body = await req.text();

  const signature =
    req.headers.get("x-hub-signature-256") ?? // Meta
    req.headers.get("x-signature") ?? // Generic
    "";

  // Verify signature if verifier exists
  const verifier = getWebhookVerifier(platform);
  const verified = verifier ? verifier(body, signature) : false;

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Generate deduplication ID
  let platformEventId: string;
  try {
    const parsed = JSON.parse(body);
    platformEventId =
      parsed.id ??
      parsed.event_id ??
      createHash("sha256")
        .update(`${platform}:${body}:${signature}`)
        .digest("hex");
  } catch {
    platformEventId = createHash("sha256")
      .update(`${platform}:${body}:${signature}`)
      .digest("hex");
  }

  // Log webhook event (idempotent upsert)
  try {
    await prisma.webhookEvent.upsert({
      where: {
        platform_platformEventId: {
          platform: platform.toUpperCase() as Platform,
          platformEventId,
        },
      },
      update: {},
      create: {
        platform: platform.toUpperCase() as Platform,
        eventType: "inbound",
        platformEventId,
        payload: JSON.parse(body),
        signature,
        verified,
      },
    });
  } catch (error) {
    console.error(`Webhook upsert failed for ${platform}:`, error);
  }

  // Enqueue for async processing
  // Note: Import Queue from bullmq and create a queue instance at module level
  // const webhookQueue = new Queue("webhook:process", { connection: redis });
  // await webhookQueue.add("process", { platform: platform.toUpperCase() as Platform, platformEventId });

  return NextResponse.json({ received: true });
}
