"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { hasAnalyticsConsent } from "@/components/cookie-consent";

function initPostHog() {
  if (
    process.env.NEXT_PUBLIC_POSTHOG_KEY &&
    typeof window !== "undefined" &&
    hasAnalyticsConsent()
  ) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      capture_pageview: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.debug();
      },
    });
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog if the user has given analytics consent
    initPostHog();

    // Re-check when consent preferences change
    const handleConsentChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.analytics) {
        initPostHog();
      } else {
        // If analytics consent was revoked, opt out
        try {
          posthog.opt_out_capturing();
        } catch {
          // PostHog may not be initialized yet
        }
      }
    };

    window.addEventListener("adpilot-consent-change", handleConsentChange);
    return () => {
      window.removeEventListener("adpilot-consent-change", handleConsentChange);
    };
  }, []);

  return (
    <SessionProvider>
      <PostHogProvider client={posthog}>{children}</PostHogProvider>
    </SessionProvider>
  );
}
