export function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="metric-card">
      <div className="section-label mb-2">{label}</div>
      <div
        className="text-2xl font-bold tracking-tight"
        style={{ color: accent ?? "var(--text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}
