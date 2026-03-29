"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 text-xl" style={{ background: "var(--accent-red-muted)", color: "var(--accent-red)" }}>!</div>
      <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Something went wrong</h2>
      <p className="text-sm mb-6 max-w-md" style={{ color: "var(--text-secondary)" }}>{error.message || "An unexpected error occurred. Please try again."}</p>
      <button onClick={reset} className="btn-primary">Try Again</button>
    </div>
  );
}
