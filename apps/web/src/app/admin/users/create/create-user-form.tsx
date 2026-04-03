"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface Org {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  organizations: Org[];
}

const SYSTEM_ROLES = ["USER", "ADMIN", "SUPER_ADMIN"] as const;
const ORG_ROLES = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  borderRadius: 8,
  border: "1px solid var(--border-primary, #2a2a2a)",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 6,
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  borderRadius: 12,
  border: "1px solid var(--border-primary, #2a2a2a)",
  padding: 24,
  maxWidth: 600,
};

export function CreateUserForm({ organizations }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [systemRole, setSystemRole] = useState<string>("USER");
  const [orgId, setOrgId] = useState("");
  const [orgRole, setOrgRole] = useState<string>("VIEWER");
  const [orgSearch, setOrgSearch] = useState("");
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [passwordMode, setPasswordMode] = useState<"email" | "manual">("email");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredOrgs = useMemo(() => {
    if (!orgSearch) return organizations;
    const lower = orgSearch.toLowerCase();
    return organizations.filter(
      (o) =>
        o.name.toLowerCase().includes(lower) ||
        o.slug.toLowerCase().includes(lower),
    );
  }, [organizations, orgSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        email: email.trim(),
        name: name.trim(),
        systemRole,
        sendWelcomeEmail,
      };

      if (orgId) {
        body.orgId = orgId;
        body.orgRole = orgRole;
      }

      if (passwordMode === "manual" && password) {
        body.password = password;
      }

      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to create user");
        return;
      }

      setSuccess(`User created: ${json.data.email}`);
      setTimeout(() => router.push("/admin/users"), 1500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={cardStyle}>
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

      {success && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "rgba(48,164,108,0.12)",
            color: "#30a46c",
            fontSize: 13,
            marginBottom: 16,
            border: "1px solid rgba(48,164,108,0.25)",
          }}
        >
          {success}
        </div>
      )}

      {/* Email */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Email *</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          style={inputStyle}
        />
      </div>

      {/* Name */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Name *</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          style={inputStyle}
        />
      </div>

      {/* System Role */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>System Role</label>
        <select
          value={systemRole}
          onChange={(e) => setSystemRole(e.target.value)}
          style={inputStyle}
        >
          {SYSTEM_ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Organization */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Organization (optional)</label>
        <input
          type="text"
          value={orgSearch}
          onChange={(e) => setOrgSearch(e.target.value)}
          placeholder="Search organizations..."
          style={{ ...inputStyle, marginBottom: 6 }}
        />
        <select
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          style={inputStyle}
        >
          <option value="">None</option>
          {filteredOrgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.slug})
            </option>
          ))}
        </select>
      </div>

      {/* Org Role (shown when org is selected) */}
      {orgId && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Organization Role</label>
          <select
            value={orgRole}
            onChange={(e) => setOrgRole(e.target.value)}
            style={inputStyle}
          >
            {ORG_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Password Mode */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Password</label>
        <div style={{ display: "flex", gap: 16 }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="passwordMode"
              checked={passwordMode === "email"}
              onChange={() => setPasswordMode("email")}
            />
            User sets via email
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--text-primary)",
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="passwordMode"
              checked={passwordMode === "manual"}
              onChange={() => setPasswordMode("manual")}
            />
            Set manually
          </label>
        </div>
      </div>

      {passwordMode === "manual" && (
        <div style={{ marginBottom: 16 }}>
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
      )}

      {/* Send Welcome Email */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={sendWelcomeEmail}
            onChange={(e) => setSendWelcomeEmail(e.target.checked)}
          />
          Send welcome email
        </label>
      </div>

      {/* Submit */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "10px 24px",
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
          {submitting ? "Creating..." : "Create User"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            border: "1px solid var(--border-primary, #2a2a2a)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
