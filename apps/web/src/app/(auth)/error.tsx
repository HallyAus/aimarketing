"use client";

import { useEffect } from "react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Auth Error]", error);
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
        Authentication error
      </h2>
      <p
        className="text-sm mb-6 max-w-md"
        style={{ color: "var(--text-secondary)" }}
      >
        We ran into a problem. Please try again or return to the sign-in page.
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn-primary">
          Try Again
        </button>
        <a href="/signin" className="btn-secondary">
          Back to Sign In
        </a>
      </div>
    </div>
  );
}
