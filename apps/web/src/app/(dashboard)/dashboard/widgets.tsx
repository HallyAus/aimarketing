"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useActiveAccount } from "@/components/client-account-banner";

interface DashboardMetrics {
  totalPosts: number;
  scheduledCount: number;
  publishedToday: number;
  engagementRate: number;
}

function AnimatedCounter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplay(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevRef.current = end;
      }
    }

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}</span>;
}

const POLL_INTERVAL = 30_000;

export function DashboardWidgets() {
  const activeAccount = useActiveAccount();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPosts: 0,
    scheduledCount: 0,
    publishedToday: 0,
    engagementRate: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const pageId = activeAccount?.id;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const params = new URLSearchParams();
      if (pageId) params.set("pageId", pageId);
      if (tz) params.set("tz", tz);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`/api/analytics/dashboard-widgets${qs}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setLastUpdated(new Date());
        setSecondsAgo(0);
      }
    } catch {
      // silently fail, will retry
    } finally {
      setLoading(false);
    }
  }, [activeAccount?.id]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  if (loading) {
    return (
      <div className="flex items-center gap-4 mb-3 px-1 h-6">
        <div className="skeleton h-4 w-48 rounded" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 px-1 text-xs"
      style={{ color: "var(--text-tertiary)" }}
      role="status"
      aria-live="polite"
      aria-label="Live dashboard metrics"
    >
      {/* Live metrics bar — compact, integrated */}
      <div className="flex items-center gap-3">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          aria-hidden="true"
          style={{
            background: secondsAgo < 35 ? "var(--accent-emerald)" : "var(--accent-amber)",
            animation: secondsAgo < 35 ? "pulse 2s infinite" : "none",
          }}
        />
        <span>{secondsAgo < 35 ? "Live" : "Stale"}</span>
      </div>

      <span className="hidden sm:inline" style={{ color: "var(--border-primary)" }} aria-hidden="true">|</span>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>
          Posts: <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
            <AnimatedCounter value={metrics.totalPosts} />
          </span>
        </span>
        <span>
          Queued: <span className="font-medium" style={{ color: "var(--accent-amber)" }}>
            <AnimatedCounter value={metrics.scheduledCount} />
          </span>
        </span>
        <span>
          Today: <span className="font-medium" style={{ color: "var(--accent-emerald)" }}>
            <AnimatedCounter value={metrics.publishedToday} />
          </span>
        </span>
        <span className="hidden sm:inline">
          Engagement: <span className="font-medium" style={{ color: "var(--accent-purple)" }}>
            <AnimatedCounter value={metrics.engagementRate} decimals={1} />%
          </span>
        </span>
      </div>

      <span className="hidden sm:inline" style={{ color: "var(--border-primary)" }} aria-hidden="true">|</span>

      <span>{secondsAgo}s ago</span>
      <button
        onClick={fetchMetrics}
        className="btn-ghost px-1.5 py-0.5 text-[11px]"
        style={{ minHeight: "auto" }}
        aria-label="Refresh dashboard metrics"
      >
        Refresh
      </button>
    </div>
  );
}
