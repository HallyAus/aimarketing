import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  accent?: string;
  trend?: {
    value: number;       // e.g. 12.5 for +12.5%
    direction: "up" | "down";
  };
  icon?: ReactNode;
}

export function MetricCard({ label, value, accent, trend, icon }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-2">
        <div className="section-label">{label}</div>
        {icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <div
          className="text-2xl font-bold tracking-tight"
          style={{ color: accent ?? "var(--text-primary)" }}
        >
          {value}
        </div>
        {trend && (
          <span
            className="inline-flex items-center gap-0.5 text-xs font-medium mb-1"
            style={{
              color:
                trend.direction === "up"
                  ? "var(--accent-emerald)"
                  : "var(--accent-red)",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              style={{
                transform: trend.direction === "down" ? "rotate(180deg)" : undefined,
              }}
            >
              <path
                d="M6 2.5L9.5 6.5H2.5L6 2.5Z"
                fill="currentColor"
              />
            </svg>
            {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
