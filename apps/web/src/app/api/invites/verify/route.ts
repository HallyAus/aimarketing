import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token is required", code: "MISSING_TOKEN" },
      { status: 400 },
    );
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const invitation = await prisma.invitation.findUnique({
    where: { token: hashedToken },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
      inviter: { select: { name: true, email: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json(
      { error: "Invalid invitation token", code: "INVALID_TOKEN" },
      { status: 404 },
    );
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json(
      { error: `Invitation has already been ${invitation.status.toLowerCase()}`, code: "NOT_PENDING" },
      { status: 400 },
    );
  }

  if (invitation.expiresAt < new Date()) {
    // Mark as expired
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json(
      { error: "Invitation has expired", code: "EXPIRED" },
      { status: 400 },
    );
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: invitation.email },
    select: { id: true, name: true },
  });

  return NextResponse.json({
    data: {
      email: invitation.email,
      role: invitation.role,
      orgName: invitation.organization.name,
      orgSlug: invitation.organization.slug,
      inviterName: invitation.inviter.name ?? invitation.inviter.email,
      message: invitation.message,
      userExists: !!existingUser,
      userName: existingUser?.name ?? null,
    },
  });
}
