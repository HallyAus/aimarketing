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
      // 1. Build new URL with ?page= param (preserve other params)
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", pageId);
      router.push(`${pathname}?${params.toString()}`);

      // 2. Update cookie with page JSON for server-side reads
      const page = initialPages.find((p) => p.id === pageId);
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
      }

      // 3. Persist to user preferences
      fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastSelectedPageId: pageId }),
      }).catch(() => {
        // Silently fail — preference save is best-effort
      });

      // 4. Dispatch event for other components (backwards compat)
      window.dispatchEvent(
        new CustomEvent("account-changed", { detail: page ?? null }),
      );
    },
    [router, pathname, searchParams, initialPages],
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
