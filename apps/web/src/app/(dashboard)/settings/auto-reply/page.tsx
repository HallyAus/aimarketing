"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";

interface ReplyRule {
  id: string;
  keywords: string;
  response: string;
  isAI: boolean;
  enabled: boolean;
}

interface ReplyLog {
  id: string;
  keyword: string;
  originalMessage: string;
  reply: string;
  platform: string;
  timestamp: string;
}

const TEMPLATES: { name: string; keywords: string; response: string }[] = [
  {
    name: "Pricing Inquiry",
    keywords: "price, pricing, cost, how much, plans",
    response: "Thanks for your interest! You can find our pricing details at our website. Feel free to DM us for a custom quote!",
  },
  {
    name: "Business Hours",
    keywords: "hours, open, available, when, schedule",
    response: "We're available Monday-Friday, 9 AM to 6 PM EST. For urgent inquiries, please email support@company.com",
  },
  {
    name: "Thank You Response",
    keywords: "thanks, thank you, appreciate, grateful",
    response: "Thank you so much for your kind words! We really appreciate your support. Stay tuned for more updates!",
  },
  {
    name: "Support Request",
    keywords: "help, support, issue, problem, broken",
    response: "We're sorry to hear you're having trouble! Please reach out to our support team at support@company.com and we'll get this sorted for you ASAP.",
  },
];

export default function AutoReplyPage() {
  const [enabled, setEnabled] = useState(false);
  const [rules, setRules] = useState<ReplyRule[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [newKeywords, setNewKeywords] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [useAI, setUseAI] = useState(false);
  const [logs] = useState<ReplyLog[]>([]);
  const [activeTab, setActiveTab] = useState<"rules" | "logs">("rules");
  const [loadingRules, setLoadingRules] = useState(true);

  // Load saved rules from DB on mount
  useEffect(() => {
    fetch("/api/webhooks/rules?trigger=AUTO_REPLY")
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.length > 0) {
          const loaded = data.data.map((r: { id: string; config: { keyword?: string; response?: string; useAi?: boolean }; isActive: boolean }) => ({
            id: r.id,
            keywords: r.config?.keyword ?? "",
            response: r.config?.response ?? "[AI-generated response]",
            isAI: r.config?.useAi ?? false,
            enabled: r.isActive,
          }));
          setRules(loaded);
          setEnabled(loaded.some((r: ReplyRule) => r.enabled));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRules(false));
  }, []);

  async function addRule() {
    if (!newKeywords.trim()) return;
    try {
      const res = await fetch("/api/webhooks/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Auto-Reply: ${newKeywords.trim().split(",")[0]}`,
          trigger: "AUTO_REPLY",
          action: "AI_RESPOND",
          config: {
            keyword: newKeywords.trim(),
            response: useAI ? "[AI-generated response]" : newResponse.trim(),
            useAi: useAI,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create rule");

      const rule: ReplyRule = {
        id: data.id,
        keywords: newKeywords.trim(),
        response: useAI ? "[AI-generated response]" : newResponse.trim(),
        isAI: useAI,
        enabled: true,
      };
      setRules((prev) => [...prev, rule]);
      setNewKeywords("");
      setNewResponse("");
      setUseAI(false);
    } catch {
      // Fallback to local-only
      const rule: ReplyRule = {
        id: crypto.randomUUID(),
        keywords: newKeywords.trim(),
        response: useAI ? "[AI-generated response]" : newResponse.trim(),
        isAI: useAI,
        enabled: true,
      };
      setRules((prev) => [...prev, rule]);
      setNewKeywords("");
      setNewResponse("");
      setUseAI(false);
    }
  }

  async function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    try {
      await fetch(`/api/webhooks/rules?ruleId=${id}`, { method: "DELETE" });
    } catch { /* non-critical */ }
  }

  async function toggleRule(id: string) {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    const newEnabled = !rule.enabled;
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: newEnabled } : r))
    );
    try {
      await fetch("/api/webhooks/rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId: id, isActive: newEnabled }),
      });
    } catch { /* non-critical */ }
  }

  async function addFromTemplate(template: (typeof TEMPLATES)[0]) {
    setNewKeywords(template.keywords);
    setNewResponse(template.response);
    setUseAI(false);
    try {
      const res = await fetch("/api/webhooks/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Auto-Reply: ${template.name}`,
          trigger: "AUTO_REPLY",
          action: "AI_RESPOND",
          config: {
            keyword: template.keywords,
            response: template.response,
            useAi: false,
          },
        }),
      });
      const data = await res.json();
      const rule: ReplyRule = {
        id: data.id ?? crypto.randomUUID(),
        keywords: template.keywords,
        response: template.response,
        isAI: false,
        enabled: true,
      };
      setRules((prev) => [...prev, rule]);
    } catch {
      const rule: ReplyRule = {
        id: crypto.randomUUID(),
        keywords: template.keywords,
        response: template.response,
        isAI: false,
        enabled: true,
      };
      setRules((prev) => [...prev, rule]);
    }
    setShowTemplates(false);
    setNewKeywords("");
    setNewResponse("");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageHeader
        title="Auto-Reply Bot"
        subtitle="Set up automated replies based on keyword triggers"
        breadcrumbs={[
          { label: "Settings", href: "/settings/connections" },
          { label: "Auto-Reply" },
        ]}
      />

      {/* Master toggle */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
              Auto-Reply Bot
            </h3>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              {enabled
                ? "Bot is active and monitoring comments for keyword triggers"
                : "Enable to automatically reply to comments matching your rules"}
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className="relative w-12 h-6 rounded-full transition-colors"
            style={{
              background: enabled ? "var(--accent-emerald)" : "var(--bg-elevated)",
            }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
              style={{
                background: "white",
                transform: enabled ? "translateX(26px)" : "translateX(2px)",
              }}
            />
          </button>
        </div>
        {enabled && (
          <div className="mt-3">
            <span className="badge badge-success">Active</span>
            <span className="text-xs ml-2" style={{ color: "var(--text-tertiary)" }}>
              {rules.filter((r) => r.enabled).length} active rules
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-bar mb-6">
        <button
          onClick={() => setActiveTab("rules")}
          className={`tab-item ${activeTab === "rules" ? "tab-item-active" : ""}`}
        >
          Reply Rules ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`tab-item ${activeTab === "logs" ? "tab-item-active" : ""}`}
        >
          Reply Log ({logs.length})
        </button>
      </div>

      {activeTab === "rules" && (
        <>
          {/* Add rule form */}
          <div className="card mb-6">
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              Add Reply Rule
            </h3>
            <div className="space-y-3">
              <div>
                <label className="section-label block mb-1.5">Keyword Triggers</label>
                <input
                  type="text"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder="price, pricing, cost (comma-separated)"
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Use AI to generate responses
                  </span>
                </label>
              </div>

              {!useAI && (
                <div>
                  <label className="section-label block mb-1.5">Response Template</label>
                  <textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="The reply to send when keywords are detected..."
                    rows={3}
                    className="w-full"
                  />
                </div>
              )}

              {useAI && (
                <div
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{
                    background: "var(--accent-blue-muted)",
                    color: "var(--accent-blue)",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                  }}
                >
                  AI will generate a contextual response based on the comment and your brand voice.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={addRule}
                  disabled={!newKeywords.trim() || (!useAI && !newResponse.trim())}
                  className="btn-primary"
                >
                  Add Rule
                </button>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="btn-secondary"
                >
                  {showTemplates ? "Hide" : "Use"} Templates
                </button>
              </div>
            </div>
          </div>

          {/* Templates */}
          {showTemplates && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {TEMPLATES.map((template, i) => (
                <div key={i} className="card card-hover cursor-pointer" onClick={() => addFromTemplate(template)}>
                  <h4 className="font-medium mb-1 text-sm" style={{ color: "var(--text-primary)" }}>
                    {template.name}
                  </h4>
                  <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
                    Keywords: {template.keywords}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {template.response.slice(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Rules list */}
          {rules.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                No rules yet. Add your first reply rule above or use a template.
              </p>
            </div>
          )}
          {rules.length > 0 && (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="card flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`badge ${rule.enabled ? "badge-success" : "badge-neutral"}`}
                      >
                        {rule.enabled ? "Active" : "Paused"}
                      </span>
                      {rule.isAI && <span className="badge badge-purple">AI Response</span>}
                    </div>
                    <p className="text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                      <span style={{ color: "var(--text-tertiary)" }}>Keywords: </span>
                      {rule.keywords}
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--text-tertiary)" }}>Reply: </span>
                      {rule.response}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className="btn-ghost text-xs"
                    >
                      {rule.enabled ? "Pause" : "Enable"}
                    </button>
                    <button
                      onClick={() => removeRule(rule.id)}
                      className="btn-danger text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "logs" && (
        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Auto-Reply Log
          </h3>
          {logs.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--text-tertiary)" }}>
              No auto-replies sent yet.
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="table-row py-3 px-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-info">{log.platform}</span>
                    <span className="badge badge-neutral">{log.keyword}</span>
                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    Original: "{log.originalMessage}"
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Reply: "{log.reply}"
                  </p>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs mt-4 text-center" style={{ color: "var(--text-tertiary)" }}>
            Full auto-reply functionality requires active platform connections with comment read/write permissions.
          </p>
        </div>
      )}
    </div>
  );
}
