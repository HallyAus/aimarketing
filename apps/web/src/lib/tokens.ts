import crypto from "crypto";
import { prisma } from "@/lib/db";
import type { VerificationType, Role } from "@/lib/db";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a cryptographically secure token and its SHA-256 hash. */
export function generateSecureToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = hashToken(raw);
  return { raw, hash };
}

/** SHA-256 hash a raw token string. */
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ---------------------------------------------------------------------------
// Email verification tokens (EmailVerification model)
// ---------------------------------------------------------------------------

/**
 * Create an EmailVerification record and return the **raw** (unhashed) token
 * so it can be embedded in an email link. The stored `token` column is the
 * SHA-256 hash — the raw value is never persisted.
 */
export async function createVerificationToken(
  userId: string,
  email: string,
  type: VerificationType,
  expiresInHours = 24,
): Promise<string> {
  const { raw, hash } = generateSecureToken();

  await prisma.emailVerification.create({
    data: {
      userId,
      email,
      token: hash,
      type,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
    },
  });

  logger.info("Verification token created", { userId, type });
  return raw;
}

/**
 * Look up an EmailVerification by its raw token, validate it, and mark it as
 * used. Returns the verification record (with user) on success, or `null`.
 */
export async function verifyToken(
  rawToken: string,
  expectedType: VerificationType,
) {
  const hash = hashToken(rawToken);

  const verification = await prisma.emailVerification.findUnique({
    where: { token: hash },
    include: { user: true },
  });

  if (!verification) {
    logger.warn("Token not found during verification");
    return null;
  }

  if (verification.type !== expectedType) {
    logger.warn("Token type mismatch", {
      expected: expectedType,
      actual: verification.type,
    });
    return null;
  }

  if (verification.usedAt) {
    logger.warn("Token already used", { verificationId: verification.id });
    return null;
  }

  if (verification.expiresAt < new Date()) {
    logger.warn("Token expired", { verificationId: verification.id });
    return null;
  }

  // Mark as used
  await prisma.emailVerification.update({
    where: { id: verification.id },
    data: { usedAt: new Date() },
  });

  logger.info("Token verified successfully", {
    verificationId: verification.id,
    type: expectedType,
  });

  return verification;
}

// ---------------------------------------------------------------------------
// Invite tokens (existing Invitation model)
// ---------------------------------------------------------------------------

/**
 * Create an Invitation record for a team invite. Stores the hashed token and
 * returns the raw token for the invite link.
 */
export async function createInviteToken(
  email: string,
  orgId: string,
  invitedById: string,
  role: Role,
  message?: string,
  expiresInDays = 7,
): Promise<string> {
  const { raw, hash } = generateSecureToken();

  await prisma.invitation.create({
    data: {
      email,
      orgId,
      invitedBy: invitedById,
      role,
      token: hash,
      message: message ?? null,
      status: "PENDING",
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
    },
  });

  logger.info("Invite token created", { email, orgId, role });
  return raw;
}

/**
 * Validate an invite token. Returns the Invitation (with organization and
 * inviter) if valid, or `null` otherwise.
 */
export async function verifyInviteToken(rawToken: string) {
  const hash = hashToken(rawToken);

  const invitation = await prisma.invitation.findUnique({
    where: { token: hash },
    include: {
      organization: true,
      inviter: { select: { id: true, name: true, email: true } },
    },
  });

  if (!invitation) {
    logger.warn("Invite token not found");
    return null;
  }

  if (invitation.status !== "PENDING") {
    logger.warn("Invite no longer pending", {
      inviteId: invitation.id,
      status: invitation.status,
    });
    return null;
  }

  if (invitation.expiresAt < new Date()) {
    // Auto-expire stale invites
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    logger.warn("Invite token expired", { inviteId: invitation.id });
    return null;
  }

  return invitation;
}
