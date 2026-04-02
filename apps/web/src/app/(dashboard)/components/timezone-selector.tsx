"use client";

import { useState, useEffect } from "react";
import {
  getUserTimezone,
  setUserTimezone,
  COMMON_TIMEZONES,
} from "@/lib/timezone";

export function TimezoneSelector() {
  const [tz, setTz] = useState("Australia/Sydney");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setTz(getUserTimezone());
  }, []);

  const currentLabel =
    COMMON_TIMEZONES.find((t) => t.value === tz)?.label ?? tz;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-[var(--bg-hover)]"
        style={{ color: "var(--text-secondary)" }}
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="truncate">{currentLabel}</span>
        <svg
          className="w-3 h-3 ml-auto flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          style={{
            transform: open ? "rotate(180deg)" : undefined,
            transition: "transform 0.15s",
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 bottom-full mb-1 max-h-48 overflow-y-auto rounded-lg py-1 z-50"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-primary)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
          }}
        >
          {COMMON_TIMEZONES.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setUserTimezone(t.value);
                setTz(t.value);
                setOpen(false);
                // Reload to apply timezone changes to server-rendered content
                window.location.reload();
              }}
              className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-[var(--bg-hover)]"
              style={{
                color:
                  t.value === tz
                    ? "var(--accent-blue)"
                    : "var(--text-secondary)",
                fontWeight: t.value === tz ? 600 : 400,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              {t.label}
              {t.value === tz && " ✓"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
