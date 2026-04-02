"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createCampaign } from "./actions";
import { SubmitButton } from "@/components/submit-button";

const AUTO_SCHEDULE_INTERVALS = [
  { value: "2", label: "Every 2 hours" },
  { value: "4", label: "Every 4 hours" },
  { value: "6", label: "Every 6 hours" },
  { value: "8", label: "Every 8 hours" },
  { value: "12", label: "Every 12 hours" },
  { value: "24", label: "Every 24 hours" },
];

const OBJECTIVES = ["AWARENESS", "TRAFFIC", "ENGAGEMENT", "CONVERSIONS", "LEADS"];
const PLATFORMS = [
  "FACEBOOK",
  "INSTAGRAM",
  "TIKTOK",
  "LINKEDIN",
  "TWITTER_X",
  "YOUTUBE",
  "GOOGLE_ADS",
  "PINTEREST",
  "SNAPCHAT",
] as const;

type Platform = (typeof PLATFORMS)[number];

interface Props {
  connectedPlatforms: Set<string>;
}

export function CampaignForm({ connectedPlatforms }: Props) {
  const [state, action] = useActionState(createCampaign, {});
  const [autoSchedule, setAutoSchedule] = useState(false);

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <div
          role="alert"
          className="rounded-md px-4 py-3 text-sm"
          style={{
            background: "var(--accent-red-subtle, #fef2f2)",
            color: "var(--accent-red, #dc2626)",
            border: "1px solid var(--accent-red, #dc2626)",
          }}
        >
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="campaign-name"
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Campaign Name
        </label>
        <input
          id="campaign-name"
          name="name"
          required
          className="w-full rounded-md px-3 py-2 text-sm"
          placeholder="Summer Sale 2026"
        />
      </div>

      <div>
        <label
          htmlFor="campaign-objective"
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Objective
        </label>
        <select
          id="campaign-objective"
          name="objective"
          required
          className="w-full rounded-md px-3 py-2 text-sm"
        >
          {OBJECTIVES.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Target Platforms
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PLATFORMS.map((p: Platform) => (
            <label
              key={p}
              className="flex items-center gap-2 text-sm p-2 rounded"
              style={{
                border: "1px solid var(--border-primary)",
                color: connectedPlatforms.has(p)
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
                opacity: connectedPlatforms.has(p) ? 1 : 0.4,
                background: "var(--bg-secondary)",
              }}
            >
              <input
                type="checkbox"
                name="platforms"
                value={p}
                disabled={!connectedPlatforms.has(p)}
              />
              {p.replaceAll("_", " ")}
            </label>
          ))}
        </div>
        {connectedPlatforms.size === 0 && (
          <p className="text-sm mt-1" style={{ color: "var(--accent-red)" }}>
            No platforms connected. Connect platforms first.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="campaign-budget"
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Budget (optional)
          </label>
          <input
            id="campaign-budget"
            name="budget"
            type="number"
            step="0.01"
            min="0.01"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="campaign-currency"
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Currency
          </label>
          <input
            id="campaign-currency"
            name="currency"
            defaultValue="USD"
            maxLength={3}
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="campaign-start-date"
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Start Date
          </label>
          <input
            id="campaign-start-date"
            name="startDate"
            type="datetime-local"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="campaign-end-date"
            className="block text-sm font-medium mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            End Date
          </label>
          <input
            id="campaign-end-date"
            name="endDate"
            type="datetime-local"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Auto-Schedule Settings */}
      <div
        className="rounded-md p-4"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="autoScheduleEnabled"
            value="true"
            checked={autoSchedule}
            onChange={(e) => setAutoSchedule(e.target.checked)}
            className="rounded"
            style={{ accentColor: "var(--accent-blue)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Auto-schedule posts
          </span>
        </label>
        <p
          className="text-xs mt-1 ml-6"
          style={{ color: "var(--text-tertiary)" }}
        >
          Automatically space out draft posts at a fixed interval after campaign creation.
        </p>

        {autoSchedule && (
          <div className="mt-4 ml-6 space-y-4">
            <div>
              <label
                htmlFor="auto-interval"
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Post every
              </label>
              <select
                id="auto-interval"
                name="autoScheduleInterval"
                className="w-full rounded-md px-3 py-2 text-sm"
                defaultValue="6"
              >
                {AUTO_SCHEDULE_INTERVALS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="auto-start-date"
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Schedule Start
                </label>
                <input
                  id="auto-start-date"
                  name="autoScheduleStartDate"
                  type="datetime-local"
                  className="w-full rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="auto-end-date"
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Schedule End (optional)
                </label>
                <input
                  id="auto-end-date"
                  name="autoScheduleEndDate"
                  type="datetime-local"
                  className="w-full rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <SubmitButton loadingText="Creating...">Create Campaign</SubmitButton>
    </form>
  );
}
