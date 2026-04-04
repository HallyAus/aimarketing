"use client";

import { useState, useEffect, useCallback } from "react";

/* -------------------------------------------------------------------
 * Cookie Consent Banner
 *
 * GDPR-compliant: no non-essential cookies/scripts are loaded until
 * the user gives explicit consent.
 *
 * Preferences are stored in the `reachpilot-consent` cookie (not
 * localStorage — cookies are accessible server-side for conditional
 * script loading).
 *
 * Categories:
 *  - Essential: always on (session, CSRF)
 *  - Analytics:  PostHog  (optional)
 *  - Marketing:  third-party pixels (optional, future)
 * ----------------------------------------------------------------- */

export interface ConsentPreferences {
  essential: true; // always true, not toggleable
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_NAME = "reachpilot-consent";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function readConsent(): ConsentPreferences | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split("=")[1] ?? ""));
  } catch {
    return null;
  }
}

function writeConsent(prefs: ConsentPreferences) {
  const value = encodeURIComponent(JSON.stringify(prefs));
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** Dispatch a custom event so providers.tsx can react to consent changes */
function dispatchConsentEvent(prefs: ConsentPreferences) {
  window.dispatchEvent(
    new CustomEvent("reachpilot-consent-change", { detail: prefs }),
  );
}

export function getConsentPreferences(): ConsentPreferences | null {
  return readConsent();
}

export function hasAnalyticsConsent(): boolean {
  return readConsent()?.analytics ?? false;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readConsent();
    if (!existing) {
      setVisible(true);
    }
  }, []);

  const save = useCallback(
    (prefs: ConsentPreferences) => {
      writeConsent(prefs);
      dispatchConsentEvent(prefs);
      setVisible(false);
    },
    [],
  );

  const acceptAll = useCallback(() => {
    save({ essential: true, analytics: true, marketing: true });
  }, [save]);

  const savePreferences = useCallback(() => {
    save({ essential: true, analytics, marketing });
  }, [save, analytics, marketing]);

  const essentialOnly = useCallback(() => {
    save({ essential: true, analytics: false, marketing: false });
  }, [save]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4"
      style={{ background: "transparent", pointerEvents: "none" }}
    >
      <div
        className="mx-auto max-w-2xl rounded-xl p-6 shadow-2xl"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-primary)",
          pointerEvents: "auto",
        }}
      >
        {!showPreferences ? (
          <>
            <p
              className="text-sm mb-4"
              style={{ color: "var(--text-secondary)" }}
            >
              We use cookies to improve your experience. Essential cookies are
              required for the platform to function. Analytics cookies help us
              understand how you use ReachPilot. You can manage your preferences at
              any time.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={acceptAll}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: "var(--accent-blue)" }}
              >
                Accept All
              </button>
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-primary)",
                }}
              >
                Manage Preferences
              </button>
              <button
                onClick={essentialOnly}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                Essential Only
              </button>
            </div>
          </>
        ) : (
          <>
            <h3
              className="text-base font-semibold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Cookie Preferences
            </h3>
            <div className="space-y-4 mb-4">
              {/* Essential — always on */}
              <label className="flex items-center justify-between">
                <div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Essential
                  </span>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Required for authentication and security. Always enabled.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="h-4 w-4 rounded"
                />
              </label>

              {/* Analytics */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Analytics
                  </span>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    PostHog product analytics to help us improve ReachPilot.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
              </label>

              {/* Marketing */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Marketing
                  </span>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Third-party tracking pixels and marketing tools.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={savePreferences}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: "var(--accent-blue)" }}
              >
                Save Preferences
              </button>
              <button
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ color: "var(--text-tertiary)" }}
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
