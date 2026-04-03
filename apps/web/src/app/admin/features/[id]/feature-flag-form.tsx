"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface FlagData {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  enabledForTiers: string[];
  enabledForOrgs: string[];
}

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

export function FeatureFlagForm({ flag }: { flag: FlagData | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [key, setKey] = useState(flag?.key || "");
  const [name, setName] = useState(flag?.name || "");
  const [description, setDescription] = useState(flag?.description || "");
  const [enabled, setEnabled] = useState(flag?.enabled || false);
  const [tiers, setTiers] = useState<string[]>(flag?.enabledForTiers || []);
  const [orgOverrides, setOrgOverrides] = useState(flag?.enabledForOrgs?.join(", ") || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      key,
      name,
      description,
      enabled,
      enabledForTiers: tiers,
      enabledForOrgs: orgOverrides
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const url = flag ? `/api/admin/features/${flag.id}` : "/api/admin/features";
      const res = await fetch(url, {
        method: flag ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/admin/features");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!flag || !confirm("Are you sure you want to delete this feature flag?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/features/${flag.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/features");
      router.refresh();
    } catch {
      setError("Failed to delete feature flag");
    } finally {
      setDeleting(false);
    }
  }

  function toggleTier(tier: string) {
    setTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
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
        <label style={labelStyle}>Key</label>
        <input
          type="text"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="e.g. ai_content_studio"
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Human-readable name"
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this flag control?"
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          Globally Enabled
        </label>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Enabled Tiers</label>
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

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Org Override IDs (comma-separated)</label>
        <input
          type="text"
          value={orgOverrides}
          onChange={(e) => setOrgOverrides(e.target.value)}
          placeholder="org_id1, org_id2"
          style={inputStyle}
        />
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
          {saving ? "Saving..." : flag ? "Update Flag" : "Create Flag"}
        </button>

        {flag && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: "10px 24px",
              background: "#7f1d1d",
              border: "none",
              borderRadius: 6,
              color: "#fca5a5",
              fontSize: 14,
              fontWeight: 600,
              cursor: deleting ? "not-allowed" : "pointer",
              opacity: deleting ? 0.7 : 1,
            }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        )}

        <a
          href="/admin/features"
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
