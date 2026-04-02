"use client";

import { useState } from "react";

const ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;

export function InviteMemberForm({ orgId }: { orgId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("EDITOR");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", message: data.error ?? "Failed to send invite" });
        return;
      }
      setFeedback({ type: "success", message: `Invitation sent to ${email}` });
      setEmail("");
      setRole("EDITOR");
    } catch {
      setFeedback({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="invite-email" className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Email address
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            required
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="w-full sm:w-36">
          <label htmlFor="invite-role" className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
            Role
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-md px-3 py-2 text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="btn-primary text-sm min-h-[44px] w-full sm:w-auto whitespace-nowrap"
          >
            {loading ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className="mt-3 rounded-md px-3 py-2 text-sm"
          role={feedback.type === "error" ? "alert" : "status"}
          style={{
            background: feedback.type === "success" ? "var(--accent-emerald-muted)" : "var(--accent-red-muted)",
            color: feedback.type === "success" ? "var(--accent-emerald)" : "var(--accent-red)",
            border: `1px solid ${feedback.type === "success" ? "var(--accent-emerald)" : "var(--accent-red)"}`,
          }}
        >
          {feedback.message}
        </div>
      )}
    </form>
  );
}
