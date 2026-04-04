"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ChecklistStep {
  key: string;
  label: string;
  href: string;
  done: boolean;
}

interface OnboardingChecklistProps {
  /** Whether the user has connected at least one platform */
  hasConnection: boolean;
  /** Whether the user has selected a page */
  hasPage: boolean;
  /** Whether the user has created at least one post */
  hasPost: boolean;
}

export function OnboardingChecklist({
  hasConnection,
  hasPage,
  hasPost,
}: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  // Persist dismissal in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("reachpilot_onboarding_dismissed");
      if (stored === "true") setDismissed(true);
    }
  }, []);

  function handleDismiss() {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("reachpilot_onboarding_dismissed", "true");
    }
  }

  if (dismissed) return null;

  const steps: ChecklistStep[] = [
    {
      key: "connect",
      label: "Connect a social account",
      href: "/settings/connections",
      done: hasConnection,
    },
    {
      key: "page",
      label: "Select a page",
      href: "/settings/connections",
      done: hasPage,
    },
    {
      key: "post",
      label: "Create your first post",
      href: "/campaigns/new",
      done: hasPost,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  // If everything is done, don't show the checklist
  if (allDone) return null;

  return (
    <div
      className="rounded-xl p-5 mb-6"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Getting started
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {completedCount} of {steps.length} complete
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg transition-colors"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-tertiary)",
            cursor: "pointer",
          }}
          aria-label="Dismiss onboarding checklist"
          title="Dismiss"
        >
          <svg
            width="16"
            height="16"
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

      {/* Progress bar */}
      <div
        className="h-1.5 rounded-full mb-4 overflow-hidden"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(completedCount / steps.length) * 100}%`,
            background: "var(--accent-blue)",
          }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step) => (
          <Link
            key={step.key}
            href={step.done ? "#" : step.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline transition-colors"
            style={{
              background: step.done ? "transparent" : "var(--bg-tertiary)",
              cursor: step.done ? "default" : "pointer",
            }}
            onClick={step.done ? (e) => e.preventDefault() : undefined}
          >
            {/* Circle / check */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: step.done
                  ? "var(--accent-emerald)"
                  : "var(--bg-elevated)",
                border: step.done
                  ? "none"
                  : "1.5px solid var(--border-primary)",
              }}
            >
              {step.done ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--text-tertiary)" }}
                />
              )}
            </div>

            {/* Label */}
            <span
              className="text-sm"
              style={{
                color: step.done
                  ? "var(--text-tertiary)"
                  : "var(--text-primary)",
                textDecoration: step.done ? "line-through" : "none",
              }}
            >
              {step.label}
            </span>

            {/* Arrow for incomplete steps */}
            {!step.done && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-auto flex-shrink-0"
                style={{ color: "var(--text-tertiary)" }}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
