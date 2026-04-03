"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

interface WebhookRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  page: { id: string; name: string; platform: string } | null;
}

const TRIGGERS = [
  { value: "POST_PUBLISHED", label: "Post Published" },
  { value: "POST_LIKES_100", label: "Post reaches 100 likes" },
  { value: "POST_LIKES_500", label: "Post reaches 500 likes" },
  { value: "POST_LIKES_1000", label: "Post reaches 1000 likes" },
  { value: "CONNECTION_EXPIRED", label: "Connection Expired" },
  { value: "CAMPAIGN_COMPLETED", label: "Campaign Completed" },
];

const ACTIONS = [
  { value: "CREATE_POST", label: "Create a Post" },
  { value: "SEND_EMAIL", label: "Send Email Notification" },
  { value: "WEBHOOK_URL", label: "Call External URL" },
];

export default function WebhooksPage() {
  const [rules, setRules] = useState<WebhookRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("POST_PUBLISHED");
  const [newAction, setNewAction] = useState("SEND_EMAIL");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks/rules");
      if (!res.ok) throw new Error("Failed to load rules");
      const data = await res.json();
      setRules(data.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const addRule = async () => {
    if (!newName || !newTrigger || !newAction) return;
    setActionLoading(true);
    setError("");
    try {
      const config: Record<string, string> = {};
      if (newAction === "WEBHOOK_URL" && newWebhookUrl) config.url = newWebhookUrl;
      if (newAction === "SEND_EMAIL" && newEmail) config.email = newEmail;

      const res = await fetch("/api/webhooks/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, trigger: newTrigger, action: newAction, config }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add rule");
      }
      setSuccess("Webhook rule created");
      setShowAdd(false);
      setNewName("");
      setNewWebhookUrl("");
      setNewEmail("");
      fetchRules();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add rule");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/webhooks/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId, isActive }),
      });
      if (!res.ok) throw new Error("Failed to update rule");
      fetchRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      const res = await fetch(`/api/webhooks/rules?ruleId=${ruleId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete rule");
      setSuccess("Rule deleted");
      fetchRules();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const testRule = async (rule: WebhookRule) => {
    setSuccess(`Testing rule "${rule.name}"... (placeholder: trigger=${rule.trigger}, action=${rule.action})`);
    setTimeout(() => setSuccess(""), 4000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Webhook Rules" subtitle="Set up automation rules — when a post hits 100 likes, send a notification" />
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary text-sm">
          Create Rule
        </button>
      </div>

      {success && <div className="alert alert-success mb-4">{success}</div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {showAdd && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">New Webhook Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Rule Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Notify on publish" className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Trigger *</label>
              <select value={newTrigger} onChange={e => setNewTrigger(e.target.value)} className="w-full">
                {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Action *</label>
              <select value={newAction} onChange={e => setNewAction(e.target.value)} className="w-full">
                {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            {newAction === "WEBHOOK_URL" && (
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Webhook URL</label>
                <input value={newWebhookUrl} onChange={e => setNewWebhookUrl(e.target.value)} placeholder="https://hooks.example.com/trigger" className="w-full" />
              </div>
            )}
            {newAction === "SEND_EMAIL" && (
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Email Address</label>
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="team@example.com" className="w-full" />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addRule} disabled={actionLoading || !newName} className="btn-primary text-sm">
              {actionLoading ? "Creating..." : "Create Rule"}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </div>
      ) : rules.length === 0 ? (
        <EmptyState title="No webhook rules" description="Create rules to automate actions when events occur." />
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="card card-hover">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-[var(--text-primary)]">{rule.name}</h4>
                    <span className={`badge text-[10px] ${rule.isActive ? "badge-success" : "badge-neutral"}`}>
                      {rule.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <span className="badge badge-info text-[10px]">
                      {TRIGGERS.find(t => t.value === rule.trigger)?.label ?? rule.trigger}
                    </span>
                    <span>-&gt;</span>
                    <span className="badge badge-purple text-[10px]">
                      {ACTIONS.find(a => a.value === rule.action)?.label ?? rule.action}
                    </span>
                    {rule.page && <span className="ml-2">{rule.page.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => testRule(rule)} className="btn-secondary text-xs">Test</button>
                  <button
                    onClick={() => toggleRule(rule.id, !rule.isActive)}
                    className="btn-ghost text-xs"
                  >
                    {rule.isActive ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="btn-danger text-xs">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
