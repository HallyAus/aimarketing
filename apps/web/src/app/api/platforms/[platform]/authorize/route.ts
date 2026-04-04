import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkPlanLimit } from "@reachpilot/shared";
import { getAdapter, type Platform } from "@reachpilot/platform-sdk";
import { encrypt } from "@reachpilot/shared";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.currentOrgId) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  const { platform } = await params;
  const platformKey = platform.toUpperCase() as Platform;

  // Check plan limit
  const org = await prisma.organization.findUnique({
    where: { id: session.user.currentOrgId },
  });
  if (!org) {
    return NextResponse.redirect(new URL("/settings/connections?error=org_not_found", req.url));
  }

  const connectionCount = await prisma.platformConnection.count({
    where: { orgId: org.id },
  });
  const limitCheck = checkPlanLimit(org.plan, "platformConnections", {
    platformConnections: connectionCount,
    postsThisMonth: 0,
    teamMembers: 0,
  });
  if (!limitCheck.allowed) {
    return NextResponse.redirect(
      new URL(`/settings/connections?error=plan_limit&upgrade=${limitCheck.upgradeRequired}`, req.url)
    );
  }

  try {
    const adapter = getAdapter(platformKey);
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/platforms/${platform}/callback`;

    const result = await adapter.getAuthorizeUrl({
      orgId: session.user.currentOrgId,
      userId: session.user.id,
      redirectUri,
    });

    // Store state + PKCE verifier + context in ENCRYPTED cookie
    const cookieStore = await cookies();
    const oauthStateJson = JSON.stringify({
      state: result.state,
      codeVerifier: result.codeVerifier,
      orgId: session.user.currentOrgId,
      userId: session.user.id,
      platform: platformKey,
    });
    const encryptedState = encrypt(oauthStateJson, process.env.MASTER_ENCRYPTION_KEY!);

    cookieStore.set("reachpilot-oauth-state", encryptedState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Must be lax for OAuth redirects
      path: "/",
      maxAge: 600, // 10 minutes
    });

    return NextResponse.redirect(result.url);
  } catch (error) {
    console.error(`OAuth authorize error for ${platform}:`, error);
    return NextResponse.redirect(
      new URL(`/settings/connections?error=oauth_failed`, req.url)
    );
  }
}
