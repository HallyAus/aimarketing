"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "@/components/client-account-banner";

interface Connection {
  id: string;
  platform: string;
  platformAccountName: string | null;
}

interface Page {
  id: string;
  name: string;
}

const QUICK_PLATFORMS = ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "TWITTER_X"] as const;

export function QuickPost() {
  const activeAccount = useActiveAccount();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<string>(activeAccount?.platform || "FACEBOOK");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/connections").then(r => r.json()).then(d => setConnections(d.data ?? [])).catch(() => {});
    fetch("/api/platforms/facebook/pages").then(r => r.json()).then(d => {
      const p = d.pages ?? [];
      setPages(p);
      if (activeAccount?.id) {
        setSelectedPageId(activeAccount.id);
      } else if (p.length > 0) {
        setSelectedPageId(p[0].id);
      }
    }).catch(() => {});
  }, [activeAccount]);

  async function saveAsDraft() {
    const content = generatedContent || topic;
    if (!content.trim()) return;
    setSavingDraft(true);
    setError("");
    try {
      const res = await fetch("/api/ai/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, platform }),
      });
      if (!res.ok) throw new Error("Failed to save draft");
      setSuccess("Saved as draft!");
      setGeneratedContent("");
      setTopic("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  }

  async function schedulePost() {
    const content = generatedContent || topic;
    if (!content.trim()) return;
    setScheduling(true);
    setError("");
    try {
      const res = await fetch("/api/posts/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drafts: [{ content, platform, pageId: selectedPageId || undefined }],
        }),
      });
      if (!res.ok) throw new Error("Failed to schedule");
      const data = await res.json();
      const time = data.scheduled?.[0]?.scheduledAt;
      setSuccess(time ? `Scheduled for ${new Date(time).toLocaleString()}` : "Scheduled!");
      setGeneratedContent("");
      setTopic("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to schedule");
    } finally {
      setScheduling(false);
    }
  }

  async function generateAndPost() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    setGeneratedContent("");

    try {
      // Step 1: Generate content
      const genRes = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, tone: "professional" }),
      });
      if (!genRes.ok) throw new Error("Failed to generate content");
      const genData = await genRes.json();
      const content = genData.content || genData.post || "";
      if (!content) throw new Error("No content generated");
      setGeneratedContent(content);

      // Step 2: Publish immediately
      setPublishing(true);
      const conn = connections.find(c => c.platform === platform);
      if (!conn) throw new Error(`No connected ${platform} account`);

      const pubRes = await fetch("/api/posts/publish-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platform,
          connectionId: conn.id,
          pageId: selectedPageId || undefined,
        }),
      });
      if (!pubRes.ok) {
        const d = await pubRes.json();
        throw new Error(d.error || "Failed to publish");
      }
      const pubData = await pubRes.json();
      setSuccess(`Posted! ${pubData.url ? pubData.url : ""}`);
      setTopic("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setPublishing(false);
    }
  }

  async function generateOnly() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setGeneratedContent("");
    try {
      const res = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, tone: "professional" }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setGeneratedContent(data.content || data.post || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  async function publishGenerated() {
    if (!generatedContent) return;
    setPublishing(true);
    setError("");
    try {
      const conn = connections.find(c => c.platform === platform);
      if (!conn) throw new Error(`No connected ${platform} account`);

      const res = await fetch("/api/posts/publish-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: generatedContent,
          platform,
          connectionId: conn.id,
          pageId: selectedPageId || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to publish");
      }
      const data = await res.json();
      setSuccess(`Posted! ${data.url ? data.url : ""}`);
      setGeneratedContent("");
      setTopic("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg p-3 text-sm font-medium text-left flex items-center gap-2 transition-colors"
        style={{
          background: "var(--accent-blue)",
          color: "white",
          border: "none",
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quick Post — Generate &amp; Publish Instantly
      </button>
    );
  }

  return (
    <div className="rounded-lg p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Post
        </h3>
        <button onClick={() => { setOpen(false); setGeneratedContent(""); setSuccess(""); setError(""); }} className="text-xs" style={{ color: "var(--text-tertiary)" }}>Close</button>
      </div>

      <div className="flex gap-2 mb-2">
        <select
          value={platform}
          onChange={e => setPlatform(e.target.value)}
          className="rounded px-3 py-2 text-xs"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
          aria-label="Platform"
        >
          {QUICK_PLATFORMS.map(p => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
        </select>
        {pages.length > 1 && (
          <select
            value={selectedPageId}
            onChange={e => setSelectedPageId(e.target.value)}
            className="flex-1 rounded px-3 py-2 text-xs"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
          >
            {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      <input
        type="text"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="What do you want to post about?"
        className="w-full rounded px-3 py-2 text-sm mb-2"
        style={{ background: "var(--bg-primary)", border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
        onKeyDown={e => { if (e.key === "Enter" && !loading) generateOnly(); }}
      />

      {generatedContent && (
        <div className="rounded-md p-3 mb-2 text-sm whitespace-pre-wrap" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-secondary)", color: "var(--text-primary)", maxHeight: 200, overflowY: "auto" }}>
          {generatedContent}
        </div>
      )}

      {error && (
        <div className="rounded-md px-3 py-2 text-xs mb-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--accent-red)" }}>
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md px-3 py-2 text-xs mb-2" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
          {success}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {!generatedContent ? (
          <>
            <button
              onClick={generateOnly}
              disabled={loading || !topic.trim()}
              className="btn-secondary text-xs flex-1"
              style={{ minHeight: 36, opacity: loading || !topic.trim() ? 0.5 : 1 }}
            >
              {loading ? "Generating..." : "Generate Preview"}
            </button>
            <button
              onClick={generateAndPost}
              disabled={loading || !topic.trim()}
              className="btn-primary text-xs flex-1"
              style={{ minHeight: 36, opacity: loading || !topic.trim() ? 0.5 : 1 }}
            >
              {loading ? (publishing ? "Publishing..." : "Generating...") : "Generate & Post Now"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => { setGeneratedContent(""); }}
              className="btn-secondary text-xs"
              style={{ minHeight: 36 }}
            >
              Discard
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(generatedContent); }}
              className="btn-secondary text-xs"
              style={{ minHeight: 36 }}
            >
              Copy
            </button>
            <button
              onClick={saveAsDraft}
              disabled={savingDraft}
              className="btn-secondary text-xs"
              style={{ minHeight: 36 }}
            >
              {savingDraft ? "Saving..." : "Save as Draft"}
            </button>
            <button
              onClick={schedulePost}
              disabled={scheduling}
              className="btn-secondary text-xs"
              style={{ minHeight: 36 }}
            >
              {scheduling ? "Scheduling..." : "Schedule"}
            </button>
            <button
              onClick={publishGenerated}
              disabled={publishing}
              className="btn-primary text-xs flex-1"
              style={{ minHeight: 36, opacity: publishing ? 0.5 : 1 }}
            >
              {publishing ? "Publishing..." : "Post Now"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
