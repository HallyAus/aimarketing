"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
      // Ease-out cubic
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

function MetricWidget({
  label,
  value,
  icon,
  color,
  decimals = 0,
  suffix = "",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  decimals?: number;
  suffix?: string;
}) {
  return (
    <div className="metric-card flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `var(--accent-${color}-muted)`, color: `var(--accent-${color})` }}
      >
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          <AnimatedCounter value={value} decimals={decimals} />{suffix}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

const POLL_INTERVAL = 30_000;

export function DashboardWidgets() {
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
      const res = await fetch("/api/analytics/dashboard-widgets");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
        setLastUpdated(new Date());
        setSecondsAgo(0);
      }
    } catch {
      // silently fail, will retry on next poll
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and every POLL_INTERVAL
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Update "seconds ago" every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="metric-card h-20 skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricWidget
          label="Total Posts"
          value={metrics.totalPosts}
          color="blue"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
            </svg>
          }
        />
        <MetricWidget
          label="Scheduled"
          value={metrics.scheduledCount}
          color="amber"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
        />
        <MetricWidget
          label="Published Today"
          value={metrics.publishedToday}
          color="emerald"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          }
        />
        <MetricWidget
          label="Engagement Rate"
          value={metrics.engagementRate}
          color="purple"
          decimals={1}
          suffix="%"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />
      </div>
      <div className="flex items-center justify-end mt-2 gap-2">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: secondsAgo < 35 ? "var(--accent-emerald)" : "var(--accent-amber)",
            animation: secondsAgo < 35 ? "pulse 2s infinite" : "none",
          }}
        />
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Last updated {secondsAgo}s ago
        </span>
        <button
          onClick={fetchMetrics}
          className="btn-ghost text-xs px-2 py-1"
          style={{ minHeight: "auto" }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
