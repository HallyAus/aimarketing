"use client";

import { Suspense, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

type Tab = "signin" | "signup";
type AuthView = "form" | "magic-link" | "magic-link-sent";

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg-primary)" }} />}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const errorParam = searchParams.get("error");

  const [tab, setTab] = useState<Tab>("signin");
  const [view, setView] = useState<AuthView>("form");
  const [isPending, startTransition] = useTransition();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [magicEmail, setMagicEmail] = useState("");

  // UI state
  const [error, setError] = useState(errorParam ? mapError(errorParam) : "");
  const [loading, setLoading] = useState<string | null>(null);

  function mapError(code: string): string {
    switch (code) {
      case "CredentialsSignin":
        return "Invalid email or password.";
      case "OAuthAccountNotLinked":
        return "This email is already associated with another sign-in method.";
      case "EmailSignin":
        return "Could not send the magic link email.";
      case "Configuration":
        return "Server configuration error. Please try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  async function handleCredentialSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading("credentials");
    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: true,
        redirectTo: callbackUrl,
      });
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(null);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading("signup");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        return;
      }

      // Auto sign in after signup — redirect to onboarding for new users
      await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: true,
        redirectTo: "/onboarding",
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading("magic");
    try {
      await signIn("resend", { email: magicEmail, callbackUrl, redirect: false });
      setView("magic-link-sent");
    } catch {
      setError("Could not send magic link. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleOAuth(provider: string) {
    setError("");
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  async function handlePasskey() {
    setError("");
    setLoading("passkey");
    try {
      // Step 1: Get authentication options from server
      const optionsRes = await fetch("/api/auth/passkey/authenticate", {
        method: "POST",
      });
      if (!optionsRes.ok) throw new Error("Failed to get options");
      const options = await optionsRes.json();

      // Step 2: Start WebAuthn authentication in browser
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const authResponse = await startAuthentication(options);

      // Step 3: Verify with server
      const verifyRes = await fetch("/api/auth/passkey/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authResponse),
      });
      if (!verifyRes.ok) throw new Error("Verification failed");
      const { passkeyToken } = await verifyRes.json();

      // Step 4: Sign in with the passkey token via credentials provider
      await signIn("credentials", {
        passkeyToken,
        redirect: true,
        redirectTo: callbackUrl,
      });
    } catch {
      setError("Passkey authentication failed. Please try again.");
      setLoading(null);
    }
  }

  // Magic link sent success view
  if (view === "magic-link-sent") {
    return (
      <Main>
        <Card>
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
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              We sent a magic link to{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {magicEmail}
              </strong>
              . Click the link to sign in.
            </p>
            <button
              type="button"
              onClick={() => {
                setView("form");
                setMagicEmail("");
              }}
              className="text-sm font-medium"
              style={{ color: "var(--accent-blue)" }}
            >
              Back to sign in
            </button>
          </div>
        </Card>
      </Main>
    );
  }

  // Magic link form view
  if (view === "magic-link") {
    return (
      <Main>
        <Card>
          <Header
            subtitle="Enter your email to receive a sign-in link"
            title="Magic Link"
          />

          {error && <ErrorBanner message={error} />}

          <form onSubmit={handleMagicLink} className="space-y-4">
            <FormField
              id="magic-email"
              label="Email address"
              type="email"
              value={magicEmail}
              onChange={setMagicEmail}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <button
              type="submit"
              disabled={loading === "magic"}
              className="btn-primary w-full text-sm py-3 min-h-[44px]"
            >
              {loading === "magic" ? <Spinner /> : "Send Magic Link"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setView("form")}
            className="w-full text-center text-sm font-medium mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Back to sign in
          </button>
        </Card>
      </Main>
    );
  }

  // Main form view
  return (
    <Main>
      <Card>
        <Header
          subtitle="Manage your marketing campaigns"
          title="Welcome to ReachPilot"
        />

        {/* Tab toggle */}
        <div
          className="flex rounded-lg p-1"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <button
            type="button"
            onClick={() => {
              setTab("signin");
              setError("");
            }}
            className="flex-1 py-2 text-sm font-medium rounded-md transition-all"
            style={{
              background:
                tab === "signin" ? "var(--bg-elevated)" : "transparent",
              color:
                tab === "signin"
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setError("");
            }}
            className="flex-1 py-2 text-sm font-medium rounded-md transition-all"
            style={{
              background:
                tab === "signup" ? "var(--bg-elevated)" : "transparent",
              color:
                tab === "signup"
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
            }}
          >
            Sign Up
          </button>
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Sign In Tab */}
        {tab === "signin" && (
          <div className="space-y-4">
            <form onSubmit={handleCredentialSignIn} className="space-y-4">
              <FormField
                id="signin-email"
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              <div>
                <FormField
                  id="signin-password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <div className="mt-1 text-right">
                  <a
                    href="/forgot-password"
                    className="text-xs font-medium"
                    style={{ color: "var(--accent-blue)" }}
                  >
                    Forgot password?
                  </a>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading === "credentials"}
                className="btn-primary w-full text-sm py-3 min-h-[44px]"
              >
                {loading === "credentials" ? <Spinner /> : "Sign In"}
              </button>
            </form>

            <Divider />

            {/* OAuth buttons */}
            <div className="flex gap-3">
              <OAuthButton
                label="Google"
                loading={loading === "google"}
                onClick={() => handleOAuth("google")}
                icon={<GoogleIcon />}
              />
              <OAuthButton
                label="Microsoft"
                loading={loading === "microsoft-entra-id"}
                onClick={() => handleOAuth("microsoft-entra-id")}
                icon={<MicrosoftIcon />}
              />
            </div>

            {/* Magic link + Passkey */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setView("magic-link");
                  setError("");
                }}
                className="btn-secondary w-full text-sm py-2.5 min-h-[44px] flex items-center justify-center gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                Sign in with email link
              </button>
              <button
                type="button"
                onClick={handlePasskey}
                disabled={loading === "passkey"}
                className="btn-secondary w-full text-sm py-2.5 min-h-[44px] flex items-center justify-center gap-2"
              >
                {loading === "passkey" ? (
                  <Spinner />
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33"
                      />
                    </svg>
                    Sign in with Passkey
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Sign Up Tab */}
        {tab === "signup" && (
          <div className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <FormField
                id="signup-name"
                label="Full name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Jane Doe"
                autoComplete="name"
                required
              />
              <FormField
                id="signup-email"
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              <FormField
                id="signup-password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <FormField
                id="signup-confirm"
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="submit"
                disabled={loading === "signup"}
                className="btn-primary w-full text-sm py-3 min-h-[44px]"
              >
                {loading === "signup" ? <Spinner /> : "Create Account"}
              </button>
            </form>

            <p
              className="text-xs text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              By signing up you agree to our{" "}
              <a
                href="/terms"
                className="underline"
                style={{ color: "var(--text-secondary)" }}
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="underline"
                style={{ color: "var(--text-secondary)" }}
              >
                Privacy Policy
              </a>
            </p>

            <Divider />

            <div className="flex gap-3">
              <OAuthButton
                label="Google"
                loading={loading === "google"}
                onClick={() => handleOAuth("google")}
                icon={<GoogleIcon />}
              />
              <OAuthButton
                label="Microsoft"
                loading={loading === "microsoft-entra-id"}
                onClick={() => handleOAuth("microsoft-entra-id")}
                icon={<MicrosoftIcon />}
              />
            </div>
          </div>
        )}
      </Card>
    </Main>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function Main({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      {children}
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full max-w-sm space-y-5 p-6 md:p-8 rounded-xl"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
      }}
    >
      {children}
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <div
        className="text-xs font-semibold tracking-widest uppercase mb-2"
        style={{ color: "var(--accent-blue)" }}
      >
        Marketing Intelligence Platform
      </div>
      <h1
        className="text-2xl font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h1>
      <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
        {subtitle}
      </p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm"
      style={{
        background: "var(--accent-red-muted)",
        color: "var(--accent-red)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      }}
      role="alert"
    >
      {message}
    </div>
  );
}

function FormField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium mb-1.5"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full rounded-md px-4 py-3 md:py-2.5 text-sm"
        aria-label={label}
      />
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 h-px"
        style={{ background: "var(--border-primary)" }}
      />
      <span
        className="text-xs"
        style={{ color: "var(--text-tertiary)" }}
      >
        or continue with
      </span>
      <div
        className="flex-1 h-px"
        style={{ background: "var(--border-primary)" }}
      />
    </div>
  );
}

function OAuthButton({
  label,
  loading,
  onClick,
  icon,
}: {
  label: string;
  loading: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="btn-secondary flex-1 py-2.5 min-h-[44px] flex items-center justify-center gap-2 text-sm"
      aria-label={`Sign in with ${label}`}
    >
      {loading ? <Spinner /> : icon}
      {label}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
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

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 23 23" aria-hidden="true">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
      <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}
