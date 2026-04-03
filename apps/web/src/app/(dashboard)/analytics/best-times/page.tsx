"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { CacheStatus } from "@/components/cache-status";
import { ClientAccountBanner, useActiveAccount } from "@/components/client-account-banner";

interface TimeSlot {
  day: number; // 0-6 (Mon-Sun)
  hour: number; // 0-23
  score: number; // 0-100
}

interface PlatformRecommendation {
  platform: string;
  bestTimes: string[];
  bestDays: string[];
  reasoning: string;
}

interface BestTimesData {
  heatmap: TimeSlot[];
  platformRecommendations: PlatformRecommendation[];
  _cached?: boolean;
  _generatedAt?: string;
  _rateLimited?: boolean;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getHeatColor(score: number): string {
  if (score === 0) return "var(--bg-tertiary)";
  if (score < 20) return "rgba(59, 130, 246, 0.1)";
  if (score < 40) return "rgba(59, 130, 246, 0.25)";
  if (score < 60) return "rgba(59, 130, 246, 0.45)";
  if (score < 80) return "rgba(16, 185, 129, 0.5)";
  return "rgba(16, 185, 129, 0.8)";
}

function formatHour(h: number): string {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

export default function BestTimesPage() {
  const activeAccount = useActiveAccount();
  const [data, setData] = useState<BestTimesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");

  const fetchData = useCallback(async (regenerate = false) => {
    setLoading(true);
    setError("");
    try {
      const pageId = activeAccount?.id;
      const params = new URLSearchParams();
      if (pageId) params.set("pageId", pageId);
      if (regenerate) params.set("regenerate", "true");
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/analytics/best-times${qs}`);
      if (!res.ok) throw new Error("Failed to load data");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [activeAccount?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggleAutoOptimize() {
    const newVal = !autoOptimize;
    setAutoOptimize(newVal);
    try {
      await fetch("/api/analytics/best-times", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoOptimize: newVal }),
      });
    } catch {
      setAutoOptimize(!newVal); // revert
    }
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Best Time to Post"
        subtitle={activeAccount ? `AI analyzes your post data to find the optimal posting times for each platform — ${activeAccount.name}` : "AI analyzes your post data to find the optimal posting times for each platform"}
        breadcrumbs={[
          { label: "Analytics", href: "/analytics" },
          { label: "Best Times" },
        ]}
        action={
          <button onClick={() => fetchData(true)} className="btn-secondary" disabled={loading}>
            {loading ? "Analyzing..." : "Re-analyze"}
          </button>
        }
      />

      <CacheStatus
        cached={data?._cached}
        generatedAt={data?._generatedAt}
        rateLimited={data?._rateLimited}
        onRegenerate={() => fetchData(true)}
        loading={loading}
      />

      {error && <div className="alert alert-error mb-6">{error}</div>}

      {loading && (
        <div className="grid gap-6">
          <div className="card h-96 skeleton" />
          <div className="card h-48 skeleton" />
        </div>
      )}

      {data && !loading && (
        <>
          {/* Auto-optimize toggle */}
          <div className="card mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
                Auto-Optimize Scheduling
              </h3>
              <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
                Automatically schedule future posts at optimal times based on this analysis
              </p>
            </div>
            <button
              onClick={toggleAutoOptimize}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{
                background: autoOptimize ? "var(--accent-emerald)" : "var(--bg-elevated)",
              }}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
                style={{
                  background: "white",
                  transform: autoOptimize ? "translateX(26px)" : "translateX(2px)",
                }}
              />
            </button>
          </div>

          {/* Heatmap */}
          <div className="card mb-6">
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Engagement Heatmap
            </h3>
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Hour labels */}
                <div className="flex items-center mb-1">
                  <div className="w-10 flex-shrink-0" />
                  {HOURS.filter((h) => h % 2 === 0).map((h) => (
                    <div
                      key={h}
                      className="text-[10px] text-center"
                      style={{ color: "var(--text-tertiary)", width: "calc(100% / 12)" }}
                    >
                      {formatHour(h)}
                    </div>
                  ))}
                </div>
                {/* Grid */}
                {DAYS.map((day, dayIdx) => (
                  <div key={day} className="flex items-center gap-0.5 mb-0.5">
                    <div
                      className="w-10 text-xs font-medium flex-shrink-0 text-right pr-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {day}
                    </div>
                    <div className="flex-1 flex gap-0.5">
                      {HOURS.map((hour) => {
                        const slot = data.heatmap.find(
                          (s) => s.day === dayIdx && s.hour === hour
                        );
                        const score = slot?.score ?? 0;
                        return (
                          <div
                            key={hour}
                            className="flex-1 h-7 rounded-sm cursor-pointer transition-opacity hover:opacity-80"
                            style={{
                              background: getHeatColor(score),
                              minWidth: "20px",
                            }}
                            title={`${day} ${formatHour(hour)} - Score: ${score}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Less</span>
                  {[0, 20, 40, 60, 80].map((score) => (
                    <div
                      key={score}
                      className="w-5 h-3 rounded-sm"
                      style={{ background: getHeatColor(score === 0 ? 0 : score + 5) }}
                    />
                  ))}
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>More</span>
                </div>
              </div>
            </div>
          </div>

          {/* Platform filter */}
          <div className="tab-bar mb-6">
            {["ALL", ...data.platformRecommendations.map((p) => p.platform)].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlatform(p)}
                className={`tab-item ${selectedPlatform === p ? "tab-item-active" : ""}`}
              >
                {p === "ALL" ? "All Platforms" : p.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Platform recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.platformRecommendations
              .filter((p) => selectedPlatform === "ALL" || p.platform === selectedPlatform)
              .map((rec) => (
                <div key={rec.platform} className="card">
                  <h4 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                    {rec.platform.replace("_", " ")}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="section-label mb-1">Best Times</p>
                      <div className="flex flex-wrap gap-1">
                        {rec.bestTimes.map((t, i) => (
                          <span key={i} className="badge badge-success">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="section-label mb-1">Best Days</p>
                      <div className="flex flex-wrap gap-1">
                        {rec.bestDays.map((d, i) => (
                          <span key={i} className="badge badge-info">{d}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="section-label mb-1">Analysis</p>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {rec.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
