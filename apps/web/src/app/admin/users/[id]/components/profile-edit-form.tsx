"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  timezone: string;
  locale: string;
  status: string;
  systemRole: string;
}

export function ProfileEditForm({ user }: { user: ProfileData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user.name ?? "");
  const [timezone, setTimezone] = useState(user.timezone);
  const [status, setStatus] = useState(user.status);
  const [systemRole, setSystemRole] = useState(user.systemRole);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone, status, systemRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Save failed");
      } else {
        setEditing(false);
        router.refresh();
      }
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "minmax(100px, 140px) 1fr",
    alignItems: "center",
    gap: 8,
    padding: "10px 0",
    borderBottom: "1px solid var(--border-primary, #2a2a2a)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary)",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 13,
    color: "var(--text-primary)",
  };

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    fontSize: 13,
    borderRadius: 4,
    border: "1px solid var(--border-primary, #2a2a2a)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    outline: "none",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        {editing ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setEditing(false)}
              style={{ ...inputStyle, cursor: "pointer", background: "transparent" }}
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              style={{
                padding: "6px 14px",
                fontSize: 13,
                borderRadius: 4,
                border: "none",
                background: "var(--accent-blue)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: "6px 14px",
              fontSize: 13,
              borderRadius: 4,
              border: "1px solid var(--border-primary, #2a2a2a)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Edit
          </button>
        )}
      </div>

      <div style={fieldStyle}>
        <span style={labelStyle}>Name</span>
        {editing ? (
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        ) : (
          <span style={valueStyle}>{user.name ?? "—"}</span>
        )}
      </div>
      <div style={fieldStyle}>
        <span style={labelStyle}>Email</span>
        <span style={valueStyle}>{user.email}</span>
      </div>
      <div style={fieldStyle}>
        <span style={labelStyle}>Timezone</span>
        {editing ? (
          <input style={inputStyle} value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        ) : (
          <span style={valueStyle}>{user.timezone}</span>
        )}
      </div>
      <div style={fieldStyle}>
        <span style={labelStyle}>Locale</span>
        <span style={valueStyle}>{user.locale}</span>
      </div>
      <div style={fieldStyle}>
        <span style={labelStyle}>Status</span>
        {editing ? (
          <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
            {["ACTIVE", "SUSPENDED", "BANNED", "PENDING_VERIFICATION", "DEACTIVATED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <span style={valueStyle}>{user.status}</span>
        )}
      </div>
      <div style={fieldStyle}>
        <span style={labelStyle}>System Role</span>
        {editing ? (
          <select style={inputStyle} value={systemRole} onChange={(e) => setSystemRole(e.target.value)}>
            {["USER", "ADMIN", "SUPER_ADMIN"].map((r) => (
              <option key={r} value={r}>{r.replace("_", " ")}</option>
            ))}
          </select>
        ) : (
          <span style={valueStyle}>{user.systemRole}</span>
        )}
      </div>
      <div style={fieldStyle}>
        <span style={labelStyle}>Email Verified</span>
        <span style={valueStyle}>{user.email ? "Yes" : "No"}</span>
      </div>
    </div>
  );
}
