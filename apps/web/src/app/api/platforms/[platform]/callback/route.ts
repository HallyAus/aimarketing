import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@adpilot/db";
import { encrypt, decrypt } from "@adpilot/shared";
import { getAdapter, type Platform } from "@adpilot/platform-sdk";
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
      new URL(`/dashboard/settings/connections?error=${error}`, req.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/settings/connections?error=missing_params", req.url)
    );
  }

  // Retrieve and DECRYPT OAuth state from cookie
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("adpilot-oauth-state");
  if (!stateCookie?.value) {
    return NextResponse.redirect(
      new URL("/dashboard/settings/connections?error=invalid_state", req.url)
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
      new URL("/dashboard/settings/connections?error=invalid_state", req.url)
    );
  }

  // Validate CSRF state
  if (oauthState.state !== state || oauthState.platform !== platformKey) {
    return NextResponse.redirect(
      new URL("/dashboard/settings/connections?error=state_mismatch", req.url)
    );
  }

  // Clear the state cookie
  cookieStore.delete("adpilot-oauth-state");

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
      new URL("/dashboard/settings/connections?success=connected", req.url)
    );
  } catch (error) {
    console.error(`OAuth callback error for ${platform}:`, error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings/connections?error=exchange_failed`, req.url)
    );
  }
}
