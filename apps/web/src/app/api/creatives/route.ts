import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, ALLOWED_MIME_TYPES } from "@adpilot/shared";
import { z } from "zod";
import { uploadToR2 } from "@/lib/r2";
import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

function getMediaQueue() {
  return new Queue("media:process", { connection: redis });
}

// GET /api/creatives — list creatives for current org
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const creatives = await prisma.creative.findMany({
    where: { orgId: req.orgId, ...(new URL(req.url).searchParams.get("pageId") ? { pageId: new URL(req.url).searchParams.get("pageId") } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(creatives);
}));

// POST /api/creatives — upload a new creative
export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const name = formData.get("name") as string | null;
  const type = formData.get("type") as string | null;
  const tagsRaw = formData.get("tags") as string | null;

  if (!file || !name || !type) {
    return NextResponse.json(
      { error: "file, name, and type are required", code: "VALIDATION_ERROR", statusCode: 400 },
      { status: 400 }
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return NextResponse.json(
      { error: `Unsupported file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`, code: "INVALID_MIME", statusCode: 400 },
      { status: 400 }
    );
  }

  // Validate file size against plan
  const org = await prisma.organization.findUnique({ where: { id: req.orgId } });
  if (!org) {
    return NextResponse.json({ error: "Org not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const maxSize = PLAN_LIMITS[org.plan].maxUploadSizeBytes;
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return NextResponse.json(
      { error: `File too large. Max ${maxMB}MB for ${org.plan} plan.`, code: "FILE_TOO_LARGE", statusCode: 400 },
      { status: 400 }
    );
  }

  // Upload to R2
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "bin";
  const r2Key = `${req.orgId}/creatives/${crypto.randomUUID()}/original.${ext}`;
  const r2Url = await uploadToR2(r2Key, buffer, file.type);

  // Parse and validate tags
  const tagsSchema = z.array(z.string().max(50)).max(20);
  let tags: string[] = [];
  if (tagsRaw) {
    try {
      const parsed = JSON.parse(tagsRaw);
      const validated = tagsSchema.safeParse(parsed);
      if (validated.success) {
        tags = validated.data;
      } else {
        return NextResponse.json(
          { error: "Invalid tags format. Expected array of up to 20 strings (max 50 chars each).", code: "VALIDATION_ERROR", statusCode: 400 },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid tags JSON", code: "VALIDATION_ERROR", statusCode: 400 },
        { status: 400 }
      );
    }
  }

  // Create creative record
  const creative = await prisma.creative.create({
    data: {
      orgId: req.orgId,
      name,
      type: type as "IMAGE" | "VIDEO" | "CAROUSEL" | "STORY" | "REEL",
      r2Key,
      r2Url,
      fileSizeBytes: file.size,
      mimeType: file.type,
      tags,
    },
  });

  // Enqueue thumbnail generation
  await getMediaQueue().add("process", {
    creativeId: creative.id,
    orgId: req.orgId,
    r2Key,
    mimeType: file.type,
  });

  return NextResponse.json(creative, { status: 201 });
}));
