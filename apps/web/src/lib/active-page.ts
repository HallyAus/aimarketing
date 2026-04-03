import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * Resolves the active Page ID (internal cuid) from the active-account cookie.
 * Returns null if "all" is selected or the cookie is missing/invalid.
 * Verifies the page belongs to the given org before returning.
 */
export async function getActivePageId(orgId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("adpilot-active-page")?.value;
  if (!raw || raw === "all") return null;
  try {
    const decoded = decodeURIComponent(raw);
    const account = JSON.parse(decoded);
    if (!account?.id) return null;
    // Verify the page belongs to this org
    const page = await prisma.page.findFirst({
      where: { id: account.id, orgId },
    });
    return page?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns a Prisma where clause fragment for filtering by pageId.
 * When pageId is null (all accounts), returns empty object (no filter).
 */
export function pageWhere(pageId: string | null): { pageId?: string } {
  return pageId ? { pageId } : {};
}
