# Phase 4: Media Processing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the media processing pipeline — file upload with plan-gated size limits and MIME type validation, Cloudflare R2 storage, thumbnail generation via Sharp, Creative CRUD API, media:process worker processor, and asset library UI.

**Architecture:** Upload endpoint accepts multipart form data, validates size/type against plan limits, uploads original to R2 via S3-compatible SDK, creates a Creative record, then enqueues a `media:process` job. The worker generates thumbnails (Sharp for images) and stores them in R2. Platform-specific variant generation (resize/transcode) is prepared as infrastructure but full per-platform variants are deferred to when platform publishing needs them. The asset library UI shows a grid of creatives with upload, delete, and tag management.

**Tech Stack:** Next.js 15 API routes, @aws-sdk/client-s3 (R2-compatible), Sharp (image processing), Prisma (Creative model exists), BullMQ, Vitest

**Spec:** `docs/superpowers/specs/2026-03-29-reachpilot-foundation-design.md` — Section 4 (Creative model)

---

## File Structure

```
packages/shared/src/
├── constants.ts               # Already has ALLOWED_MIME_TYPES and plan maxUploadSizeBytes
├── validators.ts              # Add creative validators

apps/web/src/
├── lib/
│   └── r2.ts                  # R2 (S3) client singleton
├── app/api/
│   ├── creatives/
│   │   ├── route.ts           # GET list + POST upload
│   │   └── [creativeId]/
│   │       └── route.ts       # GET detail + PATCH tags + DELETE
│   └── upload/route.ts        # POST multipart upload → R2

apps/worker/src/processors/
└── media-process.ts           # media:process — thumbnail generation
```

---

### Task 1: R2 Client + Upload Validators

**Files:**
- Create: `apps/web/src/lib/r2.ts`
- Modify: `packages/shared/src/validators.ts`

- [ ] **Step 1: Create R2 client**

Create `apps/web/src/lib/r2.ts`:

```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "reachpilot-media";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}
```

- [ ] **Step 2: Add creative validators to packages/shared/src/validators.ts**

Append to existing file:

```typescript
export const createCreativeSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["IMAGE", "VIDEO", "CAROUSEL", "STORY", "REEL"]),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const updateCreativeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});
```

- [ ] **Step 3: Install @aws-sdk/client-s3 and sharp**

Run: `cd apps/web && pnpm add @aws-sdk/client-s3 sharp && pnpm add -D @types/sharp`

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/r2.ts apps/web/package.json packages/shared/src/validators.ts pnpm-lock.yaml
git commit -m "feat: add R2 client, creative validators, and Sharp dependency"
```

---

### Task 2: Creative Upload API

**Files:**
- Create: `apps/web/src/app/api/creatives/route.ts`

- [ ] **Step 1: Create creative list + upload route**

Create `apps/web/src/app/api/creatives/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { PLAN_LIMITS, ALLOWED_MIME_TYPES } from "@reachpilot/shared";
import { uploadToR2 } from "@/lib/r2";
import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

const mediaQueue = new Queue("media:process", { connection: redis });

// GET /api/creatives — list creatives for current org
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const creatives = await prisma.creative.findMany({
    where: { orgId: req.orgId },
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

  // Parse tags
  const tags = tagsRaw ? JSON.parse(tagsRaw) : [];

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
  await mediaQueue.add("process", {
    creativeId: creative.id,
    orgId: req.orgId,
    r2Key,
    mimeType: file.type,
  });

  return NextResponse.json(creative, { status: 201 });
}));
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/app/api/creatives/route.ts"
git commit -m "feat: add creative upload API with plan-gated size limits and R2 storage"
```

---

### Task 3: Creative Detail + Update + Delete API

**Files:**
- Create: `apps/web/src/app/api/creatives/[creativeId]/route.ts`

- [ ] **Step 1: Create creative detail route**

Create `apps/web/src/app/api/creatives/[creativeId]/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { updateCreativeSchema } from "@reachpilot/shared";
import { deleteFromR2 } from "@/lib/r2";

// GET /api/creatives/[creativeId]
export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const { creativeId } = await context.params;

  const creative = await prisma.creative.findFirst({
    where: { id: creativeId, orgId: req.orgId },
  });

  if (!creative) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  return NextResponse.json(creative);
}));

// PATCH /api/creatives/[creativeId] — update name/tags
export const PATCH = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { creativeId } = await context.params;
  const body = await req.json();
  const parsed = updateCreativeSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const existing = await prisma.creative.findFirst({
    where: { id: creativeId, orgId: req.orgId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const creative = await prisma.creative.update({
    where: { id: creativeId },
    data: parsed.data,
  });

  return NextResponse.json(creative);
}));

// DELETE /api/creatives/[creativeId]
export const DELETE = withErrorHandler(withRole("EDITOR", async (req, context) => {
  const { creativeId } = await context.params;

  const creative = await prisma.creative.findFirst({
    where: { id: creativeId, orgId: req.orgId },
  });

  if (!creative) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  // Delete from R2
  try {
    await deleteFromR2(creative.r2Key);
    if (creative.thumbnailUrl) {
      const thumbKey = creative.r2Key.replace(/\/original\./, "/thumb.");
      await deleteFromR2(thumbKey);
    }
  } catch (error) {
    console.warn("R2 cleanup failed:", error);
  }

  await prisma.creative.delete({ where: { id: creativeId } });

  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "DELETE",
      entityType: "Creative",
      entityId: creativeId,
      before: { name: creative.name, r2Key: creative.r2Key },
    },
  });

  return NextResponse.json({ success: true });
}));
```

- [ ] **Step 2: Commit**

```bash
git add "apps/web/src/app/api/creatives/[creativeId]"
git commit -m "feat: add creative detail, update, and delete routes with R2 cleanup"
```

---

### Task 4: Media Process Worker Processor

**Files:**
- Create: `apps/worker/src/processors/media-process.ts`
- Modify: `apps/worker/src/index.ts`

- [ ] **Step 1: Install sharp in worker**

Run: `cd apps/worker && pnpm add sharp @aws-sdk/client-s3 && pnpm add -D @types/sharp`

- [ ] **Step 2: Create R2 utility for worker**

Create `apps/worker/src/r2.ts`:

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "reachpilot-media";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

export async function getFromR2(key: string): Promise<Buffer> {
  const result = await r2.send(
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
  );
  const stream = result.Body;
  if (!stream) throw new Error(`Empty response for key: ${key}`);
  return Buffer.from(await stream.transformToByteArray());
}

export async function putToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}
```

- [ ] **Step 3: Create media process processor**

Create `apps/worker/src/processors/media-process.ts`:

```typescript
import type { Job } from "bullmq";
import sharp from "sharp";
import { prisma } from "@reachpilot/db";
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
```

- [ ] **Step 4: Wire processor into worker**

Read `apps/worker/src/index.ts` and add:

Import:
```typescript
import { processMediaProcess } from "./processors/media-process";
```

Replace:
```typescript
createWorker("media:process", placeholderProcessor, 2),
```
with:
```typescript
createWorker("media:process", processMediaProcess, 2),
```

- [ ] **Step 5: Commit**

```bash
git add apps/worker
git commit -m "feat: add media processing worker with Sharp thumbnail generation and R2 storage"
```

---

### Task 5: Upload Validation Tests

**Files:**
- Modify: `packages/shared/__tests__/validators.test.ts`

- [ ] **Step 1: Add creative validator tests**

Append to `packages/shared/__tests__/validators.test.ts`:

```typescript
import { createCreativeSchema, updateCreativeSchema } from "../src/validators";

describe("createCreativeSchema", () => {
  it("should accept valid creative data", () => {
    const result = createCreativeSchema.safeParse({
      name: "Hero Banner",
      type: "IMAGE",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = createCreativeSchema.safeParse({
      name: "",
      type: "IMAGE",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid type", () => {
    const result = createCreativeSchema.safeParse({
      name: "Test",
      type: "GIF",
    });
    expect(result.success).toBe(false);
  });

  it("should accept tags array", () => {
    const result = createCreativeSchema.safeParse({
      name: "Test",
      type: "VIDEO",
      tags: ["summer", "promo"],
    });
    expect(result.success).toBe(true);
  });

  it("should reject more than 20 tags", () => {
    const result = createCreativeSchema.safeParse({
      name: "Test",
      type: "IMAGE",
      tags: Array(21).fill("tag"),
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCreativeSchema", () => {
  it("should accept partial update", () => {
    const result = updateCreativeSchema.safeParse({ tags: ["new-tag"] });
    expect(result.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd packages/shared && pnpm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add packages/shared/__tests__/validators.test.ts
git commit -m "test: add creative validator tests"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Install all deps**

Run: `cd /d/Claude/Projects/aimarketing && pnpm install`

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: All tests pass

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: Phase 4 Media Processing complete — upload, R2 storage, thumbnails, asset library"
```

---

## Summary

**6 tasks, ~25 steps.** After completion, Phase 4 delivers:

- R2 (S3-compatible) client for Cloudflare R2 storage
- Creative upload API with plan-gated file size limits (50MB/200MB/500MB)
- MIME type validation (jpeg, png, webp, gif, mp4, webm, quicktime)
- Creative CRUD API (list, detail, update tags, delete with R2 cleanup)
- media:process worker processor (Sharp thumbnail generation, webp output)
- R2 upload/download/delete utilities for both web app and worker
- Creative validators with tests (6 new tests)

**Next:** Phase 5 — Analytics & Reporting
