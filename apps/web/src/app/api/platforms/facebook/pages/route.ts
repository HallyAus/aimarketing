import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { decrypt } from "@adpilot/shared";
import { getCachedOrFetch } from "@/lib/connection-cache";

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  picture?: { data?: { url?: string } };
}

interface FacebookPagesResponse {
  data?: FacebookPage[];
  error?: { message: string };
}

interface CachedPage {
  id: string;
  name: string;
  pictureUrl: string | null;
  accessToken: string;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

// GET /api/platforms/facebook/pages — list Facebook Pages the user manages
export const GET = withErrorHandler(
  withAuth(async (req) => {
    const connection = await prisma.platformConnection.findFirst({
      where: {
        orgId: req.orgId,
        platform: "FACEBOOK",
        status: "ACTIVE",
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Facebook not connected", code: "NOT_CONNECTED", statusCode: 404 },
        { status: 404 },
      );
    }

    // Check for ?force=true to bypass cache
    const forceRefresh = req.nextUrl.searchParams.get("force") === "true";

    if (forceRefresh) {
      // Bypass cache — fetch directly from Graph API
      const pages = await fetchPagesFromGraph(connection.accessToken);
      // Update the cache with fresh data
      const metadata = (connection.metadata as Record<string, unknown>) ?? {};
      const updatedMetadata = {
        ...metadata,
        cachedPages: pages as unknown,
        cachedPagesCachedAt: new Date().toISOString(),
      } as Record<string, unknown>;
      await prisma.platformConnection.update({
        where: { id: connection.id },
        data: {
          metadata: updatedMetadata as Parameters<typeof prisma.platformConnection.update>[0]["data"]["metadata"],
        },
      });
      return NextResponse.json({ pages, cached: false });
    }

    // Use cache-through helper
    const pages = await getCachedOrFetch<CachedPage[]>(
      connection.id,
      "cachedPages",
      ONE_HOUR_MS,
      () => fetchPagesFromGraph(connection.accessToken),
    );

    return NextResponse.json({ pages });
  }),
);

async function fetchPagesFromGraph(encryptedAccessToken: string): Promise<CachedPage[]> {
  const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
  const accessToken = decrypt(encryptedAccessToken, masterKey);

  const fbResponse = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture&access_token=${encodeURIComponent(accessToken)}`,
  );

  if (!fbResponse.ok) {
    const errorBody = await fbResponse.text();
    console.error("[Facebook Pages] Graph API error:", errorBody);
    throw new Error("Failed to fetch Facebook pages from Graph API");
  }

  const data = (await fbResponse.json()) as FacebookPagesResponse;

  if (data.error) {
    throw new Error(data.error.message);
  }

  return (data.data ?? []).map((page) => ({
    id: page.id,
    name: page.name,
    pictureUrl: page.picture?.data?.url ?? null,
    accessToken: page.access_token,
  }));
}

// POST /api/platforms/facebook/pages — save selected pages
export const POST = withErrorHandler(
  withAuth(async (req) => {
    const body = (await req.json()) as {
      selectedPages?: Array<{
        id: string;
        name: string;
        accessToken: string;
      }>;
    };

    if (!body.selectedPages || !Array.isArray(body.selectedPages)) {
      return NextResponse.json(
        { error: "selectedPages is required", code: "VALIDATION_ERROR", statusCode: 400 },
        { status: 400 },
      );
    }

    const connection = await prisma.platformConnection.findFirst({
      where: {
        orgId: req.orgId,
        platform: "FACEBOOK",
        status: "ACTIVE",
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Facebook not connected", code: "NOT_CONNECTED", statusCode: 404 },
        { status: 404 },
      );
    }

    const masterKey = process.env.MASTER_ENCRYPTION_KEY!;
    const { encrypt } = await import("@adpilot/shared");

    // Store selected pages and their encrypted tokens in the connection metadata
    const selectedPages = body.selectedPages.map((page) => ({
      id: page.id,
      name: page.name,
      accessToken: encrypt(page.accessToken, masterKey),
    }));

    // Preserve existing cache data in metadata
    const existingMetadata = (connection.metadata as Record<string, unknown>) ?? {};

    await prisma.platformConnection.update({
      where: { id: connection.id },
      data: {
        metadata: { ...existingMetadata, selectedPages },
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: req.orgId,
        userId: req.userId,
        action: "UPDATE_FACEBOOK_PAGES",
        entityType: "PlatformConnection",
        entityId: connection.id,
        after: {
          selectedPageIds: body.selectedPages.map((p) => p.id),
        },
      },
    });

    return NextResponse.json({ success: true, count: selectedPages.length });
  }),
);
