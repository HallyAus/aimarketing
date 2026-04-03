"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { ClientAccountBanner, useActiveAccount } from "@/components/client-account-banner";

interface AudienceData {
  demographics: {
    ageGroups: { label: string; percentage: number }[];
    genderSplit: { label: string; percentage: number }[];
    locations: { label: string; percentage: number }[];
  };
  activeHours: { hour: number; activity: number }[];
  interests: string[];
  contentPreferences: { type: string; score: number }[];
  persona: {
    name: string;
    description: string;
    traits: string[];
    platforms: string[];
    contentLikes: string[];
  };
}

function BarList({ items, color }: { items: { label: string; percentage: number }[]; color: string }) {
  const max = Math.max(...items.map((i) => i.percentage), 1);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs w-24 flex-shrink-0" style={{ color: "var(--text-secondary)" }}>
            {item.label}
          </span>
          <div className="flex-1 h-5 rounded" style={{ background: "var(--bg-tertiary)" }}>
            <div
              className="h-full rounded transition-all"
              style={{
                width: `${(item.percentage / max) * 100}%`,
                background: `var(--accent-${color})`,
                opacity: 0.7,
              }}
            />
          </div>
          <span className="text-xs w-10 text-right" style={{ color: "var(--text-tertiary)" }}>
            {item.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}

function ActivityChart({ data }: { data: { hour: number; activity: number }[] }) {
  const max = Math.max(...data.map((d) => d.activity), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d) => (
        <div key={d.hour} className="flex-1 flex flex-col items-center">
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${(d.activity / max) * 100}%`,
              background: d.activity > max * 0.7 ? "var(--accent-emerald)" : "var(--accent-blue-muted)",
              minHeight: d.activity > 0 ? "2px" : "0",
            }}
          />
          {d.hour % 4 === 0 && (
            <span className="text-[9px] mt-1" style={{ color: "var(--text-tertiary)" }}>
              {d.hour === 0 ? "12a" : d.hour < 12 ? `${d.hour}a` : d.hour === 12 ? "12p" : `${d.hour - 12}p`}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AudiencePage() {
  const activeAccount = useActiveAccount();
  const [data, setData] = useState<AudienceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAudience = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const pageId = activeAccount?.id;
      const qs = pageId ? `?pageId=${encodeURIComponent(pageId)}` : "";
      const res = await fetch(`/api/analytics/audience${qs}`);
      if (!res.ok) throw new Error("Failed to load audience insights");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [activeAccount?.id]);

  useEffect(() => {
    fetchAudience();
  }, [fetchAudience]);

  return (
    <div className="w-full">
      <PageHeader
        title="Audience Insights"
        subtitle="AI estimates your audience demographics, interests, and most active hours"
        breadcrumbs={[
          { label: "Analytics", href: "/analytics" },
          { label: "Audience" },
        ]}
        action={
          <button onClick={fetchAudience} className="btn-secondary" disabled={loading}>
            {loading ? "Analyzing..." : "Re-analyze"}
          </button>
        }
      />

      {error && <div className="alert alert-error mb-6">{error}</div>}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-48 skeleton" />
          ))}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Persona card */}
          <div className="card mb-6" style={{ borderColor: "var(--accent-purple)", borderWidth: "1px" }}>
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: "var(--accent-purple-muted)", color: "var(--accent-purple)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <p className="section-label mb-1">Your Ideal Follower</p>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  {data.persona.name}
                </h3>
                <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                  {data.persona.description}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                      Key Traits
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {data.persona.traits.map((t) => (
                        <span key={t} className="badge badge-purple">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                      Preferred Platforms
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {data.persona.platforms.map((p) => (
                        <span key={p} className="badge badge-info">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
                      Content They Love
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {data.persona.contentLikes.map((c) => (
                        <span key={c} className="badge badge-success">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Age Groups */}
            <div className="card">
              <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Estimated Age Distribution
              </h3>
              <BarList items={data.demographics.ageGroups} color="blue" />
            </div>

            {/* Gender */}
            <div className="card">
              <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Estimated Gender Split
              </h3>
              <BarList items={data.demographics.genderSplit} color="purple" />
            </div>

            {/* Locations */}
            <div className="card">
              <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Top Locations
              </h3>
              <BarList items={data.demographics.locations} color="emerald" />
            </div>

            {/* Active Hours */}
            <div className="card">
              <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Audience Active Hours
              </h3>
              <ActivityChart data={data.activeHours} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Interests */}
            <div className="card">
              <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Audience Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.interests.map((interest) => (
                  <span key={interest} className="badge badge-neutral">{interest}</span>
                ))}
              </div>
            </div>

            {/* Content Preferences */}
            <div className="card">
              <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Content Preferences
              </h3>
              <BarList
                items={data.contentPreferences.map((c) => ({
                  label: c.type,
                  percentage: c.score,
                }))}
                color="amber"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
