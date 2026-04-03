"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface AnnouncementData {
  id: string;
  title: string;
  body: string;
  type: string;
  isActive: boolean;
  showFrom: string;
  showUntil: string;
  targetTiers: string[];
}

const TYPES = ["INFO", "WARNING", "MAINTENANCE", "FEATURE"] as const;
const TIERS = ["FREE", "PRO", "AGENCY"] as const;

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "var(--bg-secondary)",
  border: "1px solid var(--border-primary, #2a2a2a)",
  borderRadius: 6,
  color: "var(--text-primary)",
  fontSize: 14,
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: 6,
};

export function AnnouncementForm({ announcement }: { announcement: AnnouncementData | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(announcement?.title || "");
  const [body, setBody] = useState(announcement?.body || "");
  const [type, setType] = useState(announcement?.type || "INFO");
  const [isActive, setIsActive] = useState(announcement?.isActive ?? true);
  const [showFrom, setShowFrom] = useState(announcement?.showFrom || "");
  const [showUntil, setShowUntil] = useState(announcement?.showUntil || "");
  const [tiers, setTiers] = useState<string[]>(announcement?.targetTiers || []);

  function toggleTier(tier: string) {
    setTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      title,
      body,
      type,
      isActive,
      showFrom: showFrom || null,
      showUntil: showUntil || null,
      targetTiers: tiers,
    };

    try {
      const url = announcement
        ? `/api/admin/announcements/${announcement.id}`
        : "/api/admin/announcements";
      const res = await fetch(url, {
        method: announcement ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/admin/announcements");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
      {error && (
        <div style={{
          padding: "10px 16px",
          background: "#7f1d1d",
          border: "1px solid #991b1b",
          borderRadius: 6,
          color: "#fca5a5",
          fontSize: 13,
          marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={5}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={inputStyle}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          Active
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>Show From</label>
          <input
            type="datetime-local"
            value={showFrom}
            onChange={(e) => setShowFrom(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Show Until</label>
          <input
            type="datetime-local"
            value={showUntil}
            onChange={(e) => setShowUntil(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Target Tiers (leave empty for all)</label>
        <div style={{ display: "flex", gap: 16 }}>
          {TIERS.map((tier) => (
            <label key={tier} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-primary)", fontSize: 14 }}>
              <input
                type="checkbox"
                checked={tiers.includes(tier)}
                onChange={() => toggleTier(tier)}
                style={{ width: 16, height: 16 }}
              />
              {tier}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 24px",
            background: "var(--accent-blue)",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : announcement ? "Update" : "Create Announcement"}
        </button>
        <a
          href="/admin/announcements"
          style={{
            padding: "10px 24px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary, #2a2a2a)",
            borderRadius: 6,
            color: "var(--text-secondary)",
            fontSize: 14,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
