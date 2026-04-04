import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ActivePageResult {
  pageId: string;
  page: {
    id: string;
    orgId: string;
    platform: string;
    name: string;
    platformPageId: string;
    connectionId: string;
    avatarUrl: string | null;
    isActive: boolean;
    followerCount: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Resolver                                                           */
/* ------------------------------------------------------------------ */

/**
 * Resolves the active page for the current request.
 *
 * Resolution order:
 *   1. URL searchParams `?page=`
 *   2. Cookie `reachpilot-active-page`
 *   3. DB `User.lastSelectedPageId`
 *   4. Redirect to `/select-page`
 */
export async function getActivePageServer(
  searchParams?: { page?: string },
): Promise<ActivePageResult> {
  const session = await auth();
  const userId = session?.user?.id;

  // 1. Try URL searchParam
  const pageIdFromParam = searchParams?.page;
  if (pageIdFromParam) {
    const page = await findPage(pageIdFromParam);
    if (page) return { pageId: page.id, page: mapPage(page) };
  }

  // 2. Try cookie
  const cookieStore = await cookies();
  const raw = cookieStore.get("reachpilot-active-page")?.value;
  if (raw && raw !== "all") {
    try {
      const decoded = decodeURIComponent(raw);
      const parsed = JSON.parse(decoded);
      if (parsed?.id) {
        const page = await findPage(parsed.id);
        if (page) return { pageId: page.id, page: mapPage(page) };
      }
    } catch {
      // Invalid cookie — fall through
    }
  }

  // 3. Try DB lastSelectedPageId (wrapped for pre-migration resilience)
  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { lastSelectedPageId: true },
      });
      if (user?.lastSelectedPageId) {
        const page = await findPage(user.lastSelectedPageId);
        if (page) return { pageId: page.id, page: mapPage(page) };
      }
    } catch {
      // Field may not exist yet
    }
  }

  // 4. No page resolved — redirect to selection page
  redirect("/select-page");
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type PageRow = Awaited<ReturnType<typeof findPage>>;

async function findPage(pageId: string) {
  try {
    return await prisma.page.findFirst({
      where: { id: pageId, isActive: true },
      select: {
        id: true,
        orgId: true,
        platform: true,
        name: true,
        platformPageId: true,
        connectionId: true,
        isActive: true,
      },
    });
  } catch {
    return null;
  }
}

function mapPage(page: NonNullable<PageRow>): ActivePageResult["page"] {
  return {
    id: page.id,
    orgId: page.orgId,
    platform: page.platform,
    name: page.name,
    platformPageId: page.platformPageId,
    connectionId: page.connectionId,
    avatarUrl: null,
    isActive: page.isActive,
    followerCount: 0,
  };
}
