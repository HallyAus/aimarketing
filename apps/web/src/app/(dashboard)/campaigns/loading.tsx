export default function CampaignsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 rounded-lg" style={{ background: "var(--bg-tertiary)" }} />
        <div className="h-9 w-32 rounded-lg" style={{ background: "var(--bg-tertiary)" }} />
      </div>

      {/* Campaign cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl p-4 space-y-2"
            style={{ background: "var(--bg-secondary)" }}
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-48 rounded" style={{ background: "var(--bg-tertiary)" }} />
              <div className="h-5 w-20 rounded-full" style={{ background: "var(--bg-tertiary)" }} />
            </div>
            <div className="h-3 w-64 rounded" style={{ background: "var(--bg-tertiary)" }} />
            <div className="flex gap-2 mt-2">
              <div className="h-6 w-16 rounded-full" style={{ background: "var(--bg-tertiary)" }} />
              <div className="h-6 w-16 rounded-full" style={{ background: "var(--bg-tertiary)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
