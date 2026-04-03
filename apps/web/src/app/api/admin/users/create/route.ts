import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(200),
  systemRole: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).default("USER"),
  orgId: z.string().optional(),
  orgRole: z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]).optional(),
  sendWelcomeEmail: z.boolean().default(true),
  password: z.string().min(8).max(128).optional(),
});

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors, code: "VALIDATION_ERROR" },
      { status: 400 },
    );
  }

  const { email, name, systemRole, orgId, orgRole, sendWelcomeEmail, password } =
    parsed.data;

  // Check duplicate email
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists", code: "DUPLICATE_EMAIL" },
      { status: 409 },
    );
  }

  // If orgId provided, verify it exists
  if (orgId) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId, deletedAt: null },
      select: { id: true },
    });
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found", code: "ORG_NOT_FOUND" },
        { status: 404 },
      );
    }
  }

  // Hash password if provided
  const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

  // Determine initial status
  const status = password ? "ACTIVE" : "PENDING_VERIFICATION";

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      systemRole,
      password: hashedPassword,
      status,
      onboardingComplete: !!password,
    },
    select: { id: true, email: true, name: true, status: true, systemRole: true },
  });

  // Add to organization if orgId provided
  if (orgId && orgRole) {
    await prisma.membership.create({
      data: {
        userId: user.id,
        orgId,
        role: orgRole,
        invitedBy: authResult.user.id,
        acceptedAt: new Date(),
      },
    });
  }

  // If sendWelcomeEmail and no password set, create a setup token and send email
  if (sendWelcomeEmail && !password) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        token,
        type: "PASSWORD_SETUP",
        expiresAt,
      },
    });

    // Send welcome/setup email
    try {
      const { sendEmail } = await import("@/lib/email");
      const { adminCreatedUserEmail } = await import("@/lib/email-templates");
      const emailContent = adminCreatedUserEmail({
        name: user.name ?? user.email,
        email: user.email,
        token,
        adminName: "An admin",
      });
      await sendEmail({ to: user.email, ...emailContent });
    } catch {
      // Email sending failure should not block user creation
      console.error("Failed to send welcome email to", user.email);
    }
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: authResult.user.id,
      action: "user.created",
      entityType: "User",
      entityId: user.id,
      after: {
        email: user.email,
        name: user.name,
        systemRole: user.systemRole,
        status: user.status,
        orgId: orgId ?? null,
        orgRole: orgRole ?? null,
      },
    },
  });

  return NextResponse.json({ data: { id: user.id, email: user.email } }, { status: 201 });
}
