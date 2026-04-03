"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PageInfo {
  id: string;
  platform: string;
  name: string;
  platformPageId: string;
  avatarUrl: string | null;
  isActive: boolean;
}

interface PageContextValue {
  activePageId: string | null;
  activePage: PageInfo | null;
  allPages: PageInfo[];
  switchPage: (pageId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Cookie helper                                                      */
/* ------------------------------------------------------------------ */

const COOKIE_KEY = "adpilot-active-page";

function setCookie(key: string, value: string) {
  document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const PageContext = createContext<PageContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function PageProvider({
  children,
  initialPageId,
  initialPages,
}: {
  children: ReactNode;
  initialPageId: string | null;
  initialPages: PageInfo[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activePage = useMemo(
    () => initialPages.find((p) => p.id === initialPageId) ?? null,
    [initialPages, initialPageId],
  );

  const switchPage = useCallback(
    (pageId: string) => {
      const page = initialPages.find((p) => p.id === pageId);

      // 1. Update cookie FIRST (so server reads it immediately on next request)
      if (page) {
        setCookie(
          COOKIE_KEY,
          JSON.stringify({
            id: page.id,
            platform: page.platform,
            name: page.name,
            type: "page",
            connectionId: page.platformPageId,
          }),
        );
        // Also update the legacy cookie for backwards compat
        setCookie("adpilot-active-page", JSON.stringify({
          id: page.id,
          platform: page.platform,
          name: page.name,
          type: "page",
          connectionId: page.platformPageId,
        }));
      }

      // 2. Dispatch event for client components (backwards compat)
      window.dispatchEvent(
        new CustomEvent("account-changed", { detail: page ?? null }),
      );

      // 3. Persist to user preferences (fire-and-forget)
      fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastSelectedPageId: pageId }),
      }).catch(() => {});

      // 4. Navigate — use router.refresh() to re-fetch server data with new cookie
      //    This is faster than router.push() because it reuses the current route
      router.refresh();
    },
    [router, initialPages],
  );

  const value = useMemo<PageContextValue>(
    () => ({
      activePageId: initialPageId,
      activePage,
      allPages: initialPages,
      switchPage,
    }),
    [initialPageId, activePage, initialPages, switchPage],
  );

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useActivePage(): PageContextValue {
  const ctx = useContext(PageContext);
  if (!ctx) {
    throw new Error("useActivePage must be used within a PageProvider");
  }
  return ctx;
}
