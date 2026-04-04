import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@reachpilot/shared";
import { getAdapter, type Platform } from "@reachpilot/platform-sdk";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const platformKey = platform.toUpperCase() as Platform;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/connections?error=${error}`, req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings/connections?error=missing_params", req.url)
    );
  }

  // Retrieve and DECRYPT OAuth state from cookie
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("reachpilot-oauth-state");
  if (!stateCookie?.value) {
    return NextResponse.redirect(
      new URL("/settings/connections?error=invalid_state", req.url)
    );
  }

  let oauthState: {
    state: string;
    codeVerifier?: string;
    orgId: string;
    userId: string;
    platform: string;
  };

  try {
    const decryptedJson = decrypt(stateCookie.value, process.env.MASTER_ENCRYPTION_KEY!);
    oauthState = JSON.parse(decryptedJson);
  } catch {
    return NextResponse.redirect(
      new URL("/settings/connections?error=invalid_state", req.url)
    );
  }

  // Validate CSRF state
  if (oauthState.state !== state || oauthState.platform !== platformKey) {
    return NextResponse.redirect(
      new URL("/settings/connections?error=state_mismatch", req.url)
    );
  }

  // Clear the state cookie
  cookieStore.delete("reachpilot-oauth-state");

  try {
    const adapter = getAdapter(platformKey);
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/${platform}/callback`;

    const tokens = await adapter.exchangeCode({
      code,
      state,
      redirectUri,
      codeVerifier: oauthState.codeVerifier,
    });

    const masterKey = process.env.MASTER_ENCRYPTION_KEY!;

    // Upsert the platform connection
    await prisma.platformConnection.upsert({
      where: {
        orgId_platform_platformUserId: {
          orgId: oauthState.orgId,
          platform: platformKey,
          platformUserId: tokens.platformUserId,
        },
      },
      update: {
        accessToken: encrypt(tokens.accessToken, masterKey),
        refreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken, masterKey)
          : null,
        tokenExpiresAt: tokens.expiresAt,
        platformAccountName: tokens.platformAccountName,
        scopes: tokens.scopes,
        status: "ACTIVE",
        metadata: (tokens.metadata as never) ?? undefined,
      },
      create: {
        orgId: oauthState.orgId,
        platform: platformKey,
        accessToken: encrypt(tokens.accessToken, masterKey),
        refreshToken: tokens.refreshToken
          ? encrypt(tokens.refreshToken, masterKey)
          : null,
        tokenExpiresAt: tokens.expiresAt,
        platformUserId: tokens.platformUserId,
        platformAccountName: tokens.platformAccountName,
        scopes: tokens.scopes,
        status: "ACTIVE",
        connectedBy: oauthState.userId,
        metadata: (tokens.metadata as never) ?? undefined,
      },
    });

    // Look up the connection we just upserted to get its ID
    const connection = await prisma.platformConnection.findFirst({
      where: {
        orgId: oauthState.orgId,
        platform: platformKey,
        platformUserId: tokens.platformUserId,
      },
      select: { id: true },
    });

    // Auto-create a default Page record so the account appears in the selector.
    // For Facebook, pages are selected separately via /api/platforms/facebook/pages.
    // For all other platforms, create a page using the account name.
    if (connection && platformKey !== "FACEBOOK") {
      await prisma.page.upsert({
        where: {
          orgId_platform_platformPageId: {
            orgId: oauthState.orgId,
            platform: platformKey,
            platformPageId: tokens.platformUserId,
          },
        },
        update: {
          name: tokens.platformAccountName ?? platformKey,
          accessToken: encrypt(tokens.accessToken, masterKey),
          isActive: true,
        },
        create: {
          orgId: oauthState.orgId,
          connectionId: connection.id,
          platform: platformKey,
          platformPageId: tokens.platformUserId,
          name: tokens.platformAccountName ?? platformKey,
          accessToken: encrypt(tokens.accessToken, masterKey),
        },
      });
    }

    // For Facebook, try to auto-select pages if the token has page access
    if (connection && platformKey === "FACEBOOK") {
      try {
        const userToken = tokens.accessToken;
        const fbRes = await fetch(
          `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(userToken)}`
        );
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          const fbPages = fbData.data ?? [];
          for (const fbPage of fbPages) {
            const encryptedToken = encrypt(fbPage.access_token, masterKey);
            await prisma.page.upsert({
              where: {
                orgId_platform_platformPageId: {
                  orgId: oauthState.orgId,
                  platform: "FACEBOOK",
                  platformPageId: fbPage.id,
                },
              },
              update: {
                name: fbPage.name,
                accessToken: encryptedToken,
                isActive: true,
              },
              create: {
                orgId: oauthState.orgId,
                connectionId: connection.id,
                platform: "FACEBOOK",
                platformPageId: fbPage.id,
                name: fbPage.name,
                accessToken: encryptedToken,
              },
            });
          }
        }
      } catch (e) {
        console.error("[oauth] Failed to auto-fetch Facebook pages:", e);
        // Non-critical — user can still select pages manually
      }
    }

    // Trigger historical data ingestion for all newly connected pages
    try {
      const connectedPages = await prisma.page.findMany({
        where: {
          orgId: oauthState.orgId,
          connectionId: connection?.id,
          isActive: true,
        },
        select: { id: true },
      });

      for (const connectedPage of connectedPages) {
        // Create an IngestionJob record — the worker will pick it up
        const existingJob = await prisma.ingestionJob.findFirst({
          where: {
            pageId: connectedPage.id,
            status: { in: ["PENDING", "RUNNING", "PAUSED"] },
          },
        });

        if (!existingJob) {
          await prisma.ingestionJob.create({
            data: {
              pageId: connectedPage.id,
              orgId: oauthState.orgId,
              dataTypes: ["posts", "metrics"],
              status: "PENDING",
            },
          });
        }
      }
    } catch (e) {
      console.error("[oauth] Failed to create ingestion jobs:", e);
      // Non-critical — user can trigger manually from settings
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: oauthState.orgId,
        userId: oauthState.userId,
        action: "CONNECT_PLATFORM",
        entityType: "PlatformConnection",
        entityId: tokens.platformUserId,
        after: {
          platform: platformKey,
          platformAccountName: tokens.platformAccountName,
        },
      },
    });

    return NextResponse.redirect(
      new URL("/settings/connections?success=connected", req.url)
    );
  } catch (error) {
    console.error(`OAuth callback error for ${platform}:`, error);
    return NextResponse.redirect(
      new URL(`/settings/connections?error=exchange_failed`, req.url)
    );
  }
}
