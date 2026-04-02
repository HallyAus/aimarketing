import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

// GET /api/crm — list leads / synced contacts
export const GET = withErrorHandler(withRole("VIEWER", async (req) => {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    prisma.leadCapture.findMany({
      where: { orgId: req.orgId },
      include: { page: { select: { id: true, name: true, platform: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.leadCapture.count({ where: { orgId: req.orgId } }),
  ]);

  return NextResponse.json({ data: leads, pagination: { page, limit, total, hasMore: skip + leads.length < total } });
}));

// POST /api/crm — create a lead or connect CRM (placeholder)
export const POST = withErrorHandler(withRole("EDITOR", async (req) => {
  const { action, provider, name, email, company, source, pageId, metadata } = await req.json();

  if (action === "connect") {
    // Placeholder: Would initiate OAuth for HubSpot, Pipedrive, etc.
    const supportedCRMs = ["hubspot", "pipedrive", "salesforce"];
    if (!provider || !supportedCRMs.includes(provider)) {
      return NextResponse.json({ error: `Supported CRMs: ${supportedCRMs.join(", ")}`, code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: `${provider} CRM connection placeholder. OAuth flow would start here.`,
      authUrl: "#",
    });
  }

  if (action === "sync") {
    // Placeholder: Would sync leads to connected CRM
    return NextResponse.json({
      success: true,
      message: "Lead sync placeholder. Connect a CRM to enable syncing.",
    });
  }

  // Default: create a lead
  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const lead = await prisma.leadCapture.create({
    data: {
      orgId: req.orgId,
      pageId: pageId ?? null,
      name,
      email,
      company: company ?? null,
      source: source ?? "manual",
      metadata: metadata ?? null,
    },
  });

  return NextResponse.json(lead, { status: 201 });
}));

// DELETE /api/crm — delete a lead
export const DELETE = withErrorHandler(withRole("ADMIN", async (req) => {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("leadId");
  if (!leadId) {
    return NextResponse.json({ error: "leadId is required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  const lead = await prisma.leadCapture.findFirst({ where: { id: leadId, orgId: req.orgId } });
  if (!lead) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  await prisma.leadCapture.delete({ where: { id: leadId } });
  return NextResponse.json({ success: true });
}));
