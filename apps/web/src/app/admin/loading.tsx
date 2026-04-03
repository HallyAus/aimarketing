export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <div className="h-8 w-44 rounded-lg" style={{ background: "var(--bg-tertiary)" }} />

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 rounded-xl"
            style={{ background: "var(--bg-secondary)" }}
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="h-4 w-32 rounded" style={{ background: "var(--bg-tertiary)" }} />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-10 rounded-lg"
            style={{ background: "var(--bg-tertiary)" }}
          />
        ))}
      </div>
    </div>
  );
}
