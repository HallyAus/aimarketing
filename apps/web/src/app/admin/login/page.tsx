"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }} />
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    errorParam === "forbidden"
      ? "You do not have admin access."
      : ""
  );
  const [loading, setLoading] = useState(false);

  // Rate limit tracking (client-side)
  const attemptsRef = useRef(0);
  const lockoutUntilRef = useRef(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side rate limiting
    const now = Date.now();
    if (now < lockoutUntilRef.current) {
      const seconds = Math.ceil((lockoutUntilRef.current - now) / 1000);
      setError(`Too many attempts. Please wait ${seconds} seconds.`);
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      attemptsRef.current++;

      if (res?.error) {
        if (attemptsRef.current >= 5) {
          lockoutUntilRef.current = Date.now() + 60_000; // 1 minute lockout
          attemptsRef.current = 0;
          setError("Too many failed attempts. Please wait 60 seconds.");
        } else {
          setError("Invalid email or password.");
        }
        return;
      }

      // Success — reset attempts and redirect
      attemptsRef.current = 0;
      window.location.href = "/admin";
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
        className="w-full max-w-sm space-y-6 p-6 md:p-8 rounded-xl"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-primary)",
        }}
      >
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--accent-blue)" }}
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              AdPilot
            </h1>
            <span
              className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{
                background: "var(--accent-blue)",
                color: "#fff",
              }}
            >
              Admin
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Sign in to the administration panel
          </p>
        </div>

        {/* Error */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Email address
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              required
              className="w-full rounded-md px-4 py-3 md:py-2.5 text-sm"
              aria-label="Email address"
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="w-full rounded-md px-4 py-3 md:py-2.5 text-sm"
              aria-label="Password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-sm py-3 min-h-[44px]"
          >
            {loading ? <Spinner /> : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <p
          className="text-xs text-center"
          style={{ color: "var(--text-tertiary)" }}
        >
          This portal is for authorized administrators only.
        </p>
      </div>
    </main>
  );
}

function Spinner() {
  return (
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
  );
}
