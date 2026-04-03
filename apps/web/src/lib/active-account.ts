import { cookies } from "next/headers";

export interface ActiveAccount {
  id: string; // Internal Page.id (cuid) — NOT platformPageId
  platform: string;
  name: string;
  type: string;
  connectionId: string;
}

export async function getActiveAccount(): Promise<ActiveAccount | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("adpilot-active-page")?.value;
  if (!raw || raw === "all") return null; // null means "all accounts"
  try {
    const decoded = decodeURIComponent(raw);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/** Returns Prisma where filter for posts — uses internal Page.id */
export function getPageFilter(account: ActiveAccount | null) {
  if (!account) return {}; // no filter = all
  return { pageId: account.id };
}
