import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const disableSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { password } = disableSchema.parse(body);

    const userId = session.user.id;

    // Verify the user's password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: "Password verification required. OAuth users cannot disable 2FA this way." },
        { status: 400 },
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    // Delete the 2FA secret
    await prisma.twoFactorSecret.delete({
      where: { userId },
    }).catch(() => {
      // If no record exists, that's fine
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }
    console.error("[2fa/disable] Error:", error);
    return NextResponse.json(
      { error: "Failed to disable two-factor authentication" },
      { status: 500 },
    );
  }
}
