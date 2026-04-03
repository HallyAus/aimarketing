export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page header skeleton */}
      <div className="h-8 w-32 rounded-lg" style={{ background: "var(--bg-tertiary)" }} />

      {/* Metric summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl p-4 space-y-2"
            style={{ background: "var(--bg-secondary)" }}
          >
            <div className="h-3 w-20 rounded" style={{ background: "var(--bg-tertiary)" }} />
            <div className="h-6 w-16 rounded" style={{ background: "var(--bg-tertiary)" }} />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div
        className="h-64 rounded-xl"
        style={{ background: "var(--bg-secondary)" }}
      />

      {/* Table rows */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-14 rounded-lg"
            style={{ background: "var(--bg-secondary)" }}
          />
        ))}
      </div>
    </div>
  );
}
