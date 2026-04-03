export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page header skeleton */}
      <div className="h-8 w-40 rounded-lg" style={{ background: "var(--bg-tertiary)" }} />

      {/* Metric cards row */}
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

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 rounded-lg" style={{ background: "var(--bg-tertiary)" }} />
        ))}
      </div>

      {/* Content rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg"
            style={{ background: "var(--bg-secondary)" }}
          />
        ))}
      </div>
    </div>
  );
}
