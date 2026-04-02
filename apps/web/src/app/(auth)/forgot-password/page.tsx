"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError("Something went wrong. Please try again.");
      }
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
        {sent ? (
          <div className="text-center space-y-4">
            <div
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "var(--accent-emerald-muted)" }}
            >
              <svg
                className="h-6 w-6"
                style={{ color: "var(--accent-emerald)" }}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Check your email
            </h2>
            <p
              className="text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              If an account exists for{" "}
              <strong style={{ color: "var(--text-primary)" }}>{email}</strong>,
              we sent a password reset link.
            </p>
            <a
              href="/signin"
              className="inline-block text-sm font-medium"
              style={{ color: "var(--accent-blue)" }}
            >
              Back to sign in
            </a>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Reset your password
              </h1>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Enter your email and we will send you a reset link.
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Email address
                </label>
                <input
                  id="reset-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-md px-4 py-3 md:py-2.5 text-sm"
                  aria-label="Email address"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-sm py-3 min-h-[44px]"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="text-center">
              <a
                href="/signin"
                className="text-sm font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Back to sign in
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
