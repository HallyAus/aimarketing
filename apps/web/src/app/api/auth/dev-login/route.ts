import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";

// WARNING: This endpoint must be DELETED before production deployment.
// POST /api/auth/dev-login — DEV ONLY: bypass email verification
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  // Second guard: require DEV_LOGIN_SECRET to match
  const devSecret = process.env.DEV_LOGIN_SECRET;
  if (!devSecret) {
    return NextResponse.json({ error: "DEV_LOGIN_SECRET not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { email, secret } = body;

  if (secret !== devSecret) {
    return NextResponse.json({ error: "Invalid dev login secret" }, { status: 403 });
  }
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, emailVerified: new Date() },
    });
  }

  // Check for org membership
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
  });

  // Create JWT
  const token = await encode({
    token: {
      userId: user.id,
      email: user.email,
      name: user.name,
      currentOrgId: memberships[0]?.orgId,
      currentRole: memberships[0]?.role,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    salt: "authjs.session-token",
  });

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("authjs.session-token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return NextResponse.json({ success: true, userId: user.id, email: user.email });
}
