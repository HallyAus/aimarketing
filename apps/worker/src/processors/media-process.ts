import type { Job } from "bullmq";
import sharp from "sharp";
import { prisma } from "@adpilot/db";
import { getFromR2, putToR2 } from "../r2";

const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 400;

export async function processMediaProcess(job: Job): Promise<void> {
  const { creativeId, orgId, r2Key, mimeType } = job.data as {
    creativeId: string;
    orgId: string;
    r2Key: string;
    mimeType: string;
  };

  console.log(`[media:process] Processing creative ${creativeId}`);

  // Only generate thumbnails for images
  if (!mimeType.startsWith("image/")) {
    console.log(`[media:process] Skipping thumbnail for non-image: ${mimeType}`);
    return;
  }

  try {
    // Download original from R2
    const originalBuffer = await getFromR2(r2Key);

    // Get dimensions
    const metadata = await sharp(originalBuffer).metadata();
    const dimensions = metadata.width && metadata.height
      ? `${metadata.width}x${metadata.height}`
      : undefined;

    // Generate thumbnail
    const thumbnailBuffer = await sharp(originalBuffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Upload thumbnail to R2
    const thumbKey = r2Key.replace(/\/original\./, "/thumb.").replace(/\.\w+$/, ".webp");
    const thumbnailUrl = await putToR2(thumbKey, thumbnailBuffer, "image/webp");

    // Update creative record
    await prisma.creative.update({
      where: { id: creativeId },
      data: {
        thumbnailUrl,
        dimensions,
      },
    });

    console.log(`[media:process] Thumbnail generated for ${creativeId}: ${thumbnailUrl}`);
  } catch (error) {
    console.error(`[media:process] Failed for ${creativeId}:`, error);
    throw error; // Re-throw for BullMQ retry
  }
}
