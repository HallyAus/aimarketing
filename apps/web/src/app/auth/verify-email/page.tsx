"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const cardStyle: React.CSSProperties = {
  maxWidth: 480,
  margin: "80px auto",
  padding: 32,
  background: "var(--bg-secondary)",
  borderRadius: 12,
  border: "1px solid var(--border-primary, #2a2a2a)",
  textAlign: "center",
};

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing verification token");
      setLoading(false);
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Verification failed");
        } else {
          setSuccess(true);
        }
      })
      .catch(() => setError("Network error. Please try again."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={cardStyle}>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Verifying your email...
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div style={cardStyle}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(48,164,108,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#30a46c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Email Verified
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
          Your email has been successfully verified.
        </p>
        <Link
          href="/admin/login"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            borderRadius: 8,
            background: "var(--accent-blue)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(229,72,77,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#e5484d"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 8,
        }}
      >
        Verification Failed
      </h1>
      <p style={{ color: "#e5484d", fontSize: 14, marginBottom: 8 }}>{error}</p>
      <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
        This link may have expired or already been used.
      </p>
    </div>
  );
}

export default function VerifyEmailPage() { return <Suspense fallback={<div style={{ textAlign: "center", padding: 80, color: "var(--text-secondary)" }}>Loading...</div>}><VerifyEmailContent /></Suspense>; }
