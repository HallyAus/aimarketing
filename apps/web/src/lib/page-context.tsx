"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

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

const COOKIE_KEY = "reachpilot-active-page";

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
  const [currentPageId, setCurrentPageId] = useState(initialPageId);

  // Sync if server passes a different initialPageId (e.g. after refresh)
  useEffect(() => {
    setCurrentPageId(initialPageId);
  }, [initialPageId]);

  const activePage = useMemo(
    () => initialPages.find((p) => p.id === currentPageId) ?? null,
    [initialPages, currentPageId],
  );

  const switchPage = useCallback(
    (pageId: string) => {
      const page = initialPages.find((p) => p.id === pageId);

      // 1. Update client state IMMEDIATELY (instant UI update)
      setCurrentPageId(pageId);

      // 2. Update cookie (so server reads it on next request)
      if (page) {
        const cookieVal = JSON.stringify({
          id: page.id,
          platform: page.platform,
          name: page.name,
          type: "page",
          connectionId: page.platformPageId,
        });
        setCookie(COOKIE_KEY, cookieVal);
      }

      // 3. Dispatch event for other client components
      window.dispatchEvent(
        new CustomEvent("account-changed", { detail: page ?? null }),
      );

      // 4. Persist to user preferences (fire-and-forget)
      fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastSelectedPageId: pageId }),
      }).catch(() => {});

      // 5. Refresh server data with new cookie
      router.refresh();
    },
    [router, initialPages],
  );

  const value = useMemo<PageContextValue>(
    () => ({
      activePageId: currentPageId,
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
