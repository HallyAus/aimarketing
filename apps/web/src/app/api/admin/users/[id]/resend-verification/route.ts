import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/components/admin-auth";
import { createVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { emailVerificationEmail } from "@/lib/email-templates";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAdmin();
  if ("status" in authResult) return authResult;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, status: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const rawToken = await createVerificationToken(
      user.id,
      user.email,
      "EMAIL_VERIFICATION",
      72,
    );

    const emailContent = emailVerificationEmail({
      name: user.name ?? user.email,
      token: rawToken,
    });

    await sendEmail({ to: user.email, ...emailContent });

    await prisma.auditLog.create({
      data: {
        userId: authResult.user?.id,
        action: "admin.resend_verification",
        entityType: "User",
        entityId: user.id,
        after: { targetEmail: user.email } as never,
      },
    });

    return NextResponse.json({ data: { sent: true, email: user.email } });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 },
    );
  }
}
