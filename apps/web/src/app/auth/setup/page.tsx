"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const cardStyle: React.CSSProperties = {
  maxWidth: 480,
  margin: "80px auto",
  padding: 32,
  background: "var(--bg-secondary)",
  borderRadius: 12,
  border: "1px solid var(--border-primary, #2a2a2a)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  borderRadius: 8,
  border: "1px solid var(--border-primary, #2a2a2a)",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 6,
};

interface SetupData {
  userId: string;
  email: string;
  name: string | null;
}

function AccountSetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [setupData, setSetupData] = useState<SetupData | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezone, setTimezone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    if (!token) {
      setError("Missing setup token");
      setLoading(false);
      return;
    }

    fetch(`/api/auth/setup/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Invalid or expired setup link");
        } else {
          setSetupData(json.data);
          if (json.data.name) {
            setName(json.data.name);
          }
        }
      })
      .catch(() => setError("Failed to verify setup token"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          password,
          timezone,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to complete setup");
        return;
      }

      // Redirect to login
      router.push("/admin/login?setup=complete");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ ...cardStyle, textAlign: "center", color: "var(--text-secondary)" }}>
        Verifying setup link...
      </div>
    );
  }

  if (error && !setupData) {
    return (
      <div style={cardStyle}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 12,
          }}
        >
          Invalid Setup Link
        </h1>
        <p style={{ color: "#e5484d", fontSize: 14 }}>{error}</p>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 12 }}>
          This link may have expired. Please contact your administrator.
        </p>
      </div>
    );
  }

  if (!setupData) return null;

  return (
    <div style={cardStyle}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 8,
        }}
      >
        Set Up Your Account
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24 }}>
        Complete your account setup for <strong>{setupData.email}</strong>
      </p>

      {error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "rgba(229,72,77,0.12)",
            color: "#e5484d",
            fontSize: 13,
            marginBottom: 16,
            border: "1px solid rgba(229,72,77,0.25)",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Password *</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Confirm Password *</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Timezone</label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "12px 24px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent-blue)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Setting up..." : "Complete Setup"}
        </button>
      </form>
    </div>
  );
}

export default function AccountSetupPage() { return <Suspense fallback={<div style={{ textAlign: "center", padding: 80, color: "var(--text-secondary)" }}>Loading...</div>}><AccountSetupContent /></Suspense>; }
