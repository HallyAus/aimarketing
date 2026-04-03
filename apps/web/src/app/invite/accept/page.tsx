"use client";

import { useState, useEffect } from "react";
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

const btnStyle: React.CSSProperties = {
  padding: "10px 24px",
  borderRadius: 8,
  border: "none",
  background: "var(--accent-blue)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

interface InviteDetails {
  email: string;
  role: string;
  orgName: string;
  orgSlug: string;
  inviterName: string;
  message: string | null;
  userExists: boolean;
  userName: string | null;
}

export default function InviteAcceptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invite, setInvite] = useState<InviteDetails | null>(null);

  // New user registration fields
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezone, setTimezone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token");
      setLoading(false);
      return;
    }

    fetch(`/api/invites/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Invalid invitation");
        } else {
          setInvite(json.data);
          if (json.data.userName) {
            setName(json.data.userName);
          }
        }
      })
      .catch(() => setError("Failed to verify invitation"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    if (!invite) return;
    setError("");

    if (!invite.userExists) {
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
    }

    setSubmitting(true);
    try {
      const body: Record<string, string> = { token };
      if (!invite.userExists) {
        body.name = name.trim();
        body.password = password;
        body.timezone = timezone;
      }

      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to accept invitation");
        return;
      }

      setAccepted(true);
      // Redirect to login or dashboard after a moment
      setTimeout(() => {
        if (json.data.isNewUser) {
          router.push("/admin/login");
        } else {
          router.push("/dashboard");
        }
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    // For now, just redirect away
    router.push("/");
  }

  if (loading) {
    return (
      <div style={{ ...cardStyle, textAlign: "center", color: "var(--text-secondary)" }}>
        Verifying invitation...
      </div>
    );
  }

  if (accepted) {
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
          Welcome to {invite?.orgName}!
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          You have successfully joined the team. Redirecting...
        </p>
      </div>
    );
  }

  if (error && !invite) {
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
          Invalid Invitation
        </h1>
        <p style={{ color: "#e5484d", fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  if (!invite) return null;

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
        Team Invitation
      </h1>
      <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 20 }}>
        <strong>{invite.inviterName}</strong> invited you to join{" "}
        <strong>{invite.orgName}</strong> as{" "}
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 4,
            background: "var(--accent-purple, #6b4fbb)",
            color: "#fff",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          {invite.role}
        </span>
      </p>

      {invite.message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "var(--bg-primary)",
            border: "1px solid var(--border-primary, #2a2a2a)",
            fontSize: 13,
            color: "var(--text-primary)",
            marginBottom: 20,
            fontStyle: "italic",
          }}
        >
          &ldquo;{invite.message}&rdquo;
        </div>
      )}

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

      {invite.userExists ? (
        <div>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            You already have an account ({invite.email}). Click accept to join the team.
          </p>
        </div>
      ) : (
        <div>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            Create your account to join the team.
          </p>

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
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              disabled
              value={invite.email}
              style={{ ...inputStyle, opacity: 0.6 }}
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

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleAccept}
          disabled={submitting}
          style={{
            ...btnStyle,
            opacity: submitting ? 0.7 : 1,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Accepting..." : "Accept Invitation"}
        </button>
        <button
          onClick={handleDecline}
          disabled={submitting}
          style={{
            ...btnStyle,
            background: "transparent",
            border: "1px solid var(--border-primary, #2a2a2a)",
            color: "var(--text-secondary)",
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
