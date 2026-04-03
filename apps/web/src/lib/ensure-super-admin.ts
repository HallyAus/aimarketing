import { prisma } from "@/lib/db";
import { PERMANENT_SUPER_ADMINS } from "@/lib/constants/super-admins";
import { logger } from "@/lib/logger";

/**
 * Ensure every permanent super admin has `systemRole: SUPER_ADMIN` and
 * `status: ACTIVE`. Safe to call at startup or as periodic maintenance.
 *
 * Only touches users that already exist in the database — it does not
 * create accounts.
 */
export async function ensureSuperAdmins(): Promise<void> {
  for (const email of PERMANENT_SUPER_ADMINS) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, systemRole: true, status: true },
    });

    if (!user) {
      logger.info("Permanent super admin not found in database — skipping", {
        email,
      });
      continue;
    }

    const updates: Record<string, unknown> = {};

    if (user.systemRole !== "SUPER_ADMIN") {
      updates.systemRole = "SUPER_ADMIN";
    }

    if (user.status !== "ACTIVE") {
      updates.status = "ACTIVE";
    }

    if (Object.keys(updates).length === 0) {
      logger.debug("Permanent super admin already configured correctly", {
        email,
      });
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updates,
    });

    logger.info("Permanent super admin role/status corrected", {
      email,
      updates,
    });
  }
}
