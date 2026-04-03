import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

// Simple in-memory rate limiter for signups (5 per IP per hour)
const signupAttempts = new Map<string, { count: number; resetAt: number }>();

function checkSignupRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = signupAttempts.get(ip);
  if (!entry || now >= entry.resetAt) {
    signupAttempts.set(ip, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    // Rate limit
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkSignupRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { email, password, name } = parsed.data;

    // Check if user already exists — return generic message to prevent email enumeration
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { success: true, message: "If this email is available, your account has been created. Please try signing in." },
        { status: 201 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user + org + membership in a transaction
    const slug =
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
      "-" +
      Date.now().toString(36);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          password: hashedPassword,
        },
      });

      const org = await tx.organization.create({
        data: {
          name: `${name}'s Organization`,
          slug,
        },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          orgId: org.id,
          role: "OWNER",
          acceptedAt: new Date(),
        },
      });
    });

    return NextResponse.json(
      { success: true, message: "Account created" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
