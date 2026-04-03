import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";

/**
 * POST /api/account/delete
 *
 * GDPR Article 17 — Right to Erasure
 * Marks the user account for deletion with a 7-day grace period.
 * During the grace period the user can reactivate by logging in.
 * After 7 days a cron job should hard-delete the account data.
 *
 * Immediately:
 *  - Sets deletedAt on the User record
 *  - Revokes all platform connections (marks as REVOKED)
 *  - Creates an audit log entry
 *
 * Protected by auth.
 */
export const POST = withErrorHandler(async (req) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 },
      { status: 401 },
    );
  }

  const userId = session.user.id;

  // Check the user exists and isn't already marked for deletion
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, deletedAt: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found", code: "NOT_FOUND", statusCode: 404 },
      { status: 404 },
    );
  }

  if (user.deletedAt) {
    return NextResponse.json(
      {
        error: "Account is already scheduled for deletion.",
        code: "ALREADY_DELETED",
        statusCode: 409,
        deletedAt: user.deletedAt.toISOString(),
        permanentDeletionAt: new Date(
          user.deletedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      { status: 409 },
    );
  }

  const now = new Date();
  const permanentDeletionAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // --- Perform deletion steps in a transaction ---
  await prisma.$transaction(async (tx) => {
    // 1. Mark user for deletion
    await tx.user.update({
      where: { id: userId },
      data: { deletedAt: now, status: "SUSPENDED" },
    });

    // 2. Revoke all platform connections the user created
    await tx.platformConnection.updateMany({
      where: { connectedBy: userId, status: "ACTIVE" },
      data: { status: "REVOKED" },
    });

    // 3. Audit log
    await tx.auditLog.create({
      data: {
        userId,
        orgId: session.user.currentOrgId ?? null,
        action: "ACCOUNT_DELETION_REQUESTED",
        entityType: "User",
        entityId: userId,
        after: {
          deletedAt: now.toISOString(),
          permanentDeletionAt: permanentDeletionAt.toISOString(),
        },
      },
    });
  });

  // TODO: Send confirmation email via Resend
  // await sendAccountDeletionEmail(user.email, permanentDeletionAt);

  return NextResponse.json({
    success: true,
    message:
      "Your account has been scheduled for deletion. You have 7 days to reactivate by logging in.",
    deletedAt: now.toISOString(),
    permanentDeletionAt: permanentDeletionAt.toISOString(),
  });
});
