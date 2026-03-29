import { prisma } from "@adpilot/db";

/**
 * Temporary helper — returns first org ID while auth is disabled.
 * Replace with session-based org context when auth is re-enabled.
 */
export async function getOrgId(): Promise<string | null> {
  const org = await prisma.organization.findFirst({
    where: { deletedAt: null },
    select: { id: true },
  });
  return org?.id ?? null;
}
