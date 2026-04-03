"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";

interface VideoScript {
  hook: string;
  body: string;
  cta: string;
  onScreenText: string[];
  musicMood: string;
  fullScript: string;
  tips: string[];
}

const PLATFORMS = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram-reels", label: "Instagram Reels" },
  { id: "youtube-shorts", label: "YouTube Shorts" },
  { id: "youtube", label: "YouTube" },
];

const DURATIONS = [
  { id: "15s", label: "15 seconds" },
  { id: "30s", label: "30 seconds" },
  { id: "60s", label: "60 seconds" },
  { id: "3min", label: "3 minutes" },
  { id: "10min", label: "10 minutes" },
];

const STYLES = [
  { id: "tutorial", label: "Tutorial" },
  { id: "behind-the-scenes", label: "Behind the Scenes" },
  { id: "product-demo", label: "Product Demo" },
  { id: "storytelling", label: "Storytelling" },
  { id: "educational", label: "Educational" },
];

const DRAFTS_KEY = "adpilot-video-script-drafts";

export default function VideoScriptsPage() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [duration, setDuration] = useState("30s");
  const [style, setStyle] = useState("tutorial");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<VideoScript | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Array<{ topic: string; platform: string; duration: string; script: VideoScript; savedAt: string }>
  >([]);
  const [showDrafts, setShowDrafts] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFTS_KEY);
      if (stored) setDrafts(JSON.parse(stored));
    } catch { /* non-critical */ }
  }, []);

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function saveDraft() {
    if (!script) return;
    const newDrafts = [
      {
        topic,
        platform,
        duration,
        script,
        savedAt: new Date().toISOString(),
      },
      ...drafts,
    ];
    setDrafts(newDrafts);
    try {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(newDrafts));
    } catch { /* non-critical */ }
  }

  function removeDraft(index: number) {
    const newDrafts = drafts.filter((_, i) => i !== index);
    setDrafts(newDrafts);
    try {
      localStorage.setItem(DRAFTS_KEY, JSON.stringify(newDrafts));
    } catch { /* non-critical */ }
  }

  function loadDraft(index: number) {
    const draft = drafts[index];
    if (!draft) return;
    setTopic(draft.topic);
    setPlatform(draft.platform);
    setDuration(draft.duration);
    setScript(draft.script);
    setShowDrafts(false);
  }

  async function generate() {
    if (!topic.trim()) {
      setError("Enter a topic or URL");
      return;
    }
    setLoading(true);
    setError("");
    setScript(null);

    try {
      const res = await fetch("/api/ai/video-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          platform,
          duration,
          style,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setScript(data.script);
      }
    } catch {
      setError("Failed to generate video script");
    }
    setLoading(false);
  }

  return (
    <div>
      <PageHeader
        title="Video Script Generator"
        subtitle="Enter a topic \— AI writes a complete video script with hooks, CTAs, and music suggestions"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Video Scripts" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="card">
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Script Settings
            </h3>

            <div className="mb-3">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Topic or URL
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="e.g. How to style a capsule wardrobe, or paste a URL for reference"
                className="w-full rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="mb-3">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Duration
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DURATIONS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDuration(d.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background:
                        duration === d.id
                          ? "var(--accent-blue-muted)"
                          : "var(--bg-tertiary)",
                      color:
                        duration === d.id
                          ? "var(--accent-blue)"
                          : "var(--text-secondary)",
                      border: `1px solid ${
                        duration === d.id
                          ? "var(--accent-blue)"
                          : "var(--border-primary)"
                      }`,
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm"
              >
                {STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="btn-primary text-sm w-full disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Script"}
            </button>
          </div>

          {/* Drafts Toggle */}
          {drafts.length > 0 && (
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className="btn-secondary text-xs w-full"
            >
              {showDrafts ? "Hide" : "Show"} Saved Drafts ({drafts.length})
            </button>
          )}

          {showDrafts && drafts.length > 0 && (
            <div className="card">
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                Saved Drafts
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {drafts.map((draft, i) => (
                  <div
                    key={i}
                    className="rounded-md px-3 py-2 cursor-pointer transition-all"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  >
                    <div
                      className="text-xs font-medium truncate mb-0.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {draft.topic}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <span className="badge badge-neutral">
                          {draft.platform}
                        </span>
                        <span className="badge badge-neutral">
                          {draft.duration}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadDraft(i)}
                          className="text-xs"
                          style={{ color: "var(--accent-blue)" }}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => removeDraft(i)}
                          className="text-xs"
                          style={{ color: "var(--accent-red)" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Script Output */}
        <div className="lg:col-span-2">
          {loading && (
            <div className="card">
              <div className="space-y-4">
                <div className="skeleton h-6 w-1/3 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-32 w-full rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-20 w-full rounded" />
              </div>
            </div>
          )}

          {error && (
            <div className="alert-error text-xs rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {script && (
            <div className="space-y-4">
              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => copyText(script.fullScript, "full")}
                  className="btn-primary text-xs"
                >
                  {copied === "full" ? "Copied!" : "Copy Script"}
                </button>
                <button onClick={saveDraft} className="btn-secondary text-xs">
                  Save as Draft
                </button>
              </div>

              {/* Hook */}
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: "var(--accent-red-muted)",
                      color: "var(--accent-red)",
                    }}
                  >
                    !
                  </span>
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Hook (First 3 Seconds)
                  </h3>
                </div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--accent-amber)" }}
                >
                  {script.hook}
                </p>
              </div>

              {/* Body */}
              <div className="card">
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Script Body
                </h3>
                <p
                  className="text-sm whitespace-pre-wrap"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {script.body}
                </p>
              </div>

              {/* CTA */}
              <div className="card">
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Call to Action
                </h3>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--accent-emerald)" }}
                >
                  {script.cta}
                </p>
              </div>

              {/* On-Screen Text */}
              <div className="card">
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  On-Screen Text Suggestions
                </h3>
                <div className="space-y-1.5">
                  {script.onScreenText.map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-md px-3 py-2"
                      style={{ background: "var(--bg-tertiary)" }}
                    >
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {text}
                      </span>
                      <button
                        onClick={() => copyText(text, `ost-${i}`)}
                        className="text-xs flex-shrink-0 ml-2"
                        style={{ color: "var(--accent-blue)" }}
                      >
                        {copied === `ost-${i}` ? "Copied" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Music Mood */}
              <div className="card">
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Music Mood
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {script.musicMood}
                </p>
              </div>

              {/* Full Script */}
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Full Script
                  </h3>
                  <button
                    onClick={() => copyText(script.fullScript, "full2")}
                    className="text-xs"
                    style={{ color: "var(--accent-blue)" }}
                  >
                    {copied === "full2" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div
                  className="rounded-md px-4 py-3 text-sm whitespace-pre-wrap"
                  style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  {script.fullScript}
                </div>
              </div>

              {/* Production Tips */}
              {script.tips && script.tips.length > 0 && (
                <div className="card">
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Production Tips
                  </h3>
                  <ul className="space-y-1.5">
                    {script.tips.map((tip, i) => (
                      <li
                        key={i}
                        className="text-xs flex items-start gap-2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span
                          className="mt-0.5 flex-shrink-0"
                          style={{ color: "var(--accent-purple)" }}
                        >
                          *
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!loading && !script && !error && (
            <div
              className="card flex items-center justify-center"
              style={{ minHeight: 400 }}
            >
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Your video script will appear here after generation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
