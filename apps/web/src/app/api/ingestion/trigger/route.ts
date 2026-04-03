import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withRole } from "@/lib/auth-middleware";
import { createIngestionJob } from "@/lib/ingestion";

export const POST = withRole("EDITOR", async (req: NextRequest & { userId: string; orgId: string }) => {
  let body: { pageId?: string; dataTypes?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const { pageId, dataTypes } = body;

  if (!pageId) {
    return NextResponse.json(
      { error: "Missing pageId", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  // Verify the page belongs to the user's org and is active
  const page = await prisma.page.findFirst({
    where: { id: pageId, orgId: req.orgId, isActive: true },
    include: {
      connection: { select: { status: true } },
    },
  });

  if (!page) {
    return NextResponse.json(
      { error: "Page not found or inactive", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  if (page.connection.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Platform connection is not active. Please reconnect.", code: "CONNECTION_INACTIVE" },
      { status: 422 },
    );
  }

  // Check for already-running ingestion
  const existingJob = await prisma.ingestionJob.findFirst({
    where: {
      pageId,
      status: { in: ["PENDING", "RUNNING"] },
    },
  });

  if (existingJob) {
    return NextResponse.json({
      jobId: existingJob.id,
      status: existingJob.status,
      message: "An ingestion job is already in progress for this page.",
    });
  }

  const jobId = await createIngestionJob(pageId, req.orgId, dataTypes);

  // Log the action
  await prisma.auditLog.create({
    data: {
      orgId: req.orgId,
      userId: req.userId,
      action: "TRIGGER_INGESTION",
      entityType: "IngestionJob",
      entityId: jobId,
      after: { pageId, dataTypes },
    },
  });

  return NextResponse.json(
    { jobId, status: "PENDING", message: "Ingestion job created. Processing will begin shortly." },
    { status: 201 },
  );
});
