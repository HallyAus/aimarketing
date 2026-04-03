"use client";

import { useState } from "react";
import Link from "next/link";

interface UpgradePromptProps {
  /** Current usage count (e.g. 25) */
  current: number;
  /** Plan limit (e.g. 30) */
  limit: number;
  /** Resource name for display (e.g. "posts", "platforms", "team members") */
  resource: string;
  /** Target plan name (default: "Pro") */
  targetPlan?: string;
  /** Display mode: inline banner or modal overlay */
  variant?: "banner" | "modal";
  /** Called when the user closes the prompt */
  onDismiss?: () => void;
}

export function UpgradePrompt({
  current,
  limit,
  resource,
  targetPlan = "Pro",
  variant = "banner",
  onDismiss,
}: UpgradePromptProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const percentage = Math.min((current / limit) * 100, 100);
  const atLimit = current >= limit;
  const nearLimit = percentage >= 80;

  // Only show if near or at limit
  if (!nearLimit) return null;

  function handleDismiss() {
    setVisible(false);
    onDismiss?.();
  }

  const message = atLimit
    ? `You've reached your ${resource} limit (${current}/${limit}). Upgrade to ${targetPlan} for unlimited ${resource}.`
    : `You've used ${current}/${limit} ${resource} this month. Upgrade to ${targetPlan} for unlimited ${resource}.`;

  if (variant === "modal") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Upgrade prompt"
      >
        <div
          className="w-full max-w-md rounded-xl p-6"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary)",
          }}
        >
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto"
            style={{
              background: atLimit
                ? "var(--accent-amber-muted)"
                : "var(--accent-blue-muted)",
              color: atLimit
                ? "var(--accent-amber)"
                : "var(--accent-blue)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>

          <h3
            className="text-lg font-semibold text-center mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {atLimit ? "Limit reached" : "Approaching limit"}
          </h3>

          <p
            className="text-sm text-center mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            {message}
          </p>

          {/* Progress bar */}
          <div
            className="h-2 rounded-full my-4 overflow-hidden"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${percentage}%`,
                background: atLimit
                  ? "var(--accent-amber)"
                  : "var(--accent-blue)",
              }}
            />
          </div>

          <div className="flex items-center gap-3 mt-5">
            <Link
              href="/settings/billing"
              className="btn-primary text-sm flex-1 text-center"
            >
              Upgrade to {targetPlan}
            </Link>
            <button
              onClick={handleDismiss}
              className="btn-secondary text-sm flex-1"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Banner variant (default)
  return (
    <div
      className="flex items-center gap-4 rounded-xl px-4 py-3 mb-4"
      style={{
        background: atLimit
          ? "var(--accent-amber-muted)"
          : "var(--accent-blue-muted)",
        border: `1px solid ${atLimit ? "rgba(245, 158, 11, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
      }}
      role="alert"
    >
      {/* Icon */}
      <div
        className="flex-shrink-0"
        style={{
          color: atLimit ? "var(--accent-amber)" : "var(--accent-blue)",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>

      {/* Message + progress */}
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: "var(--text-primary)" }}>
          {message}
        </p>
        <div
          className="h-1 rounded-full mt-2 overflow-hidden"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              background: atLimit
                ? "var(--accent-amber)"
                : "var(--accent-blue)",
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/settings/billing"
        className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
      >
        Upgrade
      </Link>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded transition-colors"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-tertiary)",
          cursor: "pointer",
        }}
        aria-label="Dismiss upgrade prompt"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
