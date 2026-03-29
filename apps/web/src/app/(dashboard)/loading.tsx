export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg" style={{ background: "var(--bg-tertiary)" }} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-20 rounded-xl" style={{ background: "var(--bg-secondary)" }} />
        ))}
      </div>
      <div className="space-y-2">
        {[1,2,3].map(i => (
          <div key={i} className="h-14 rounded-lg" style={{ background: "var(--bg-secondary)" }} />
        ))}
      </div>
    </div>
  );
}
