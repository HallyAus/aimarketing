"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 text-xl font-bold"
        style={{
          background: "var(--accent-red-muted)",
          color: "var(--accent-red)",
        }}
      >
        !
      </div>
      <h2
        className="text-lg font-bold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        Admin panel error
      </h2>
      <p
        className="text-sm mb-2 max-w-md"
        style={{ color: "var(--text-secondary)" }}
      >
        An error occurred while loading this admin page.
      </p>
      <p
        className="text-xs mb-1 font-mono max-w-lg break-all"
        style={{ color: "var(--text-tertiary)" }}
      >
        {error.message || "Unknown error"}
      </p>
      {error.digest && (
        <p
          className="text-xs mb-4 font-mono"
          style={{ color: "var(--text-tertiary)" }}
        >
          Digest: {error.digest}
        </p>
      )}
      <p
        className="text-xs mb-6"
        style={{ color: "var(--text-tertiary)" }}
      >
        {new Date().toISOString()}
      </p>
      <button onClick={reset} className="btn-primary">
        Try Again
      </button>
    </div>
  );
}
