"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code. Please try again.");
        return;
      }

      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="w-full max-w-sm space-y-5 p-6 md:p-8 rounded-xl"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <div className="text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full mb-4"
            style={{ background: "var(--accent-blue-muted)" }}
          >
            <svg
              className="h-6 w-6"
              style={{ color: "var(--accent-blue)" }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Two-Factor Verification
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Enter the 6-digit code from your authenticator app, or an 8-character
            backup code.
          </p>
        </div>

        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              background: "var(--accent-red-muted)",
              color: "var(--accent-red)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label
              htmlFor="totp-code"
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Verification code
            </label>
            <input
              id="totp-code"
              name="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              autoComplete="one-time-code"
              required
              maxLength={8}
              className="w-full rounded-md px-4 py-3 md:py-2.5 text-sm text-center tracking-widest font-mono"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="btn-primary w-full text-sm py-3 min-h-[44px]"
          >
            {loading ? (
              <svg
                className="animate-spin h-4 w-4 mx-auto"
                style={{ color: "var(--text-secondary)" }}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              "Verify"
            )}
          </button>
        </form>

        <p
          className="text-xs text-center"
          style={{ color: "var(--text-tertiary)" }}
        >
          Lost your authenticator?{" "}
          <span style={{ color: "var(--text-secondary)" }}>
            Use a backup code instead.
          </span>
        </p>
      </div>
    </main>
  );
}
