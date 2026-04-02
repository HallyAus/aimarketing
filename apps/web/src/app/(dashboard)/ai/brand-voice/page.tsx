"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";

interface BrandVoiceProfile {
  tone: string;
  vocabulary: string[];
  sentenceStyle: string;
  doList: string[];
  dontList: string[];
  systemPrompt: string;
}

const STORAGE_KEY = "adpilot-brand-voice";

export default function BrandVoicePage() {
  const [samples, setSamples] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<BrandVoiceProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedProfile, setSavedProfile] = useState<BrandVoiceProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedProfile(JSON.parse(stored));
      }
    } catch {}
  }, []);

  function addSample() {
    setSamples((prev) => [...prev, ""]);
  }

  function removeSample(index: number) {
    setSamples((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSample(index: number, value: string) {
    setSamples((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  async function analyzeVoice() {
    const validSamples = samples.filter((s) => s.trim().length > 0);
    if (validSamples.length === 0) {
      setError("Add at least one content sample");
      return;
    }

    setLoading(true);
    setError("");
    setProfile(null);
    setSaved(false);

    try {
      const res = await fetch("/api/ai/brand-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samples: validSamples }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProfile(data.profile);
      }
    } catch {
      setError("Failed to analyze brand voice");
    }
    setLoading(false);
  }

  function saveAsDefault() {
    if (!profile) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setSavedProfile(profile);
      setSaved(true);
    } catch {
      setError("Failed to save profile");
    }
  }

  function clearSaved() {
    localStorage.removeItem(STORAGE_KEY);
    setSavedProfile(null);
  }

  return (
    <div>
      <PageHeader
        title="Brand Voice Training"
        subtitle="Upload content samples and let AI analyze your unique brand voice."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio", href: "/ai" },
          { label: "Brand Voice" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="space-y-4">
          <div className="card">
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Content Samples
            </h3>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--text-tertiary)" }}
            >
              Paste your existing content (blog posts, social posts, emails,
              website copy). The more samples you provide, the better the
              analysis.
            </p>

            {samples.map((sample, i) => (
              <div key={i} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label
                    className="text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Sample {i + 1}
                  </label>
                  {samples.length > 1 && (
                    <button
                      onClick={() => removeSample(i)}
                      className="text-xs"
                      style={{ color: "var(--accent-red)" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <textarea
                  value={sample}
                  onChange={(e) => updateSample(i, e.target.value)}
                  rows={4}
                  placeholder="Paste a content sample here (blog post, social media post, email copy, etc.)"
                  className="w-full rounded-md px-3 py-2 text-sm"
                />
              </div>
            ))}

            <div className="flex gap-2">
              <button onClick={addSample} className="btn-secondary text-xs">
                + Add Sample
              </button>
              <button
                onClick={analyzeVoice}
                disabled={loading}
                className="btn-primary text-xs disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Analyze Voice"}
              </button>
            </div>

            {error && (
              <div className="alert-error mt-3 text-xs rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {/* Saved profile indicator */}
          {savedProfile && !profile && (
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Saved Brand Voice
                </h3>
                <button
                  onClick={clearSaved}
                  className="text-xs"
                  style={{ color: "var(--accent-red)" }}
                >
                  Clear
                </button>
              </div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                <strong>Tone:</strong> {savedProfile.tone}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                This voice profile is automatically applied when generating
                content.
              </p>
              <div
                className="mt-2 rounded-md px-3 py-2 text-xs"
                style={{
                  background: "var(--accent-blue-muted)",
                  color: "var(--accent-blue)",
                }}
              >
                System prompt: {savedProfile.systemPrompt}
              </div>
            </div>
          )}
        </div>

        {/* Results panel */}
        <div>
          {loading && (
            <div className="card">
              <div className="space-y-3">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-20 w-full rounded" />
                <div className="skeleton h-4 w-2/3 rounded" />
                <div className="skeleton h-20 w-full rounded" />
              </div>
            </div>
          )}

          {profile && (
            <div className="space-y-4">
              <div className="card">
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  Brand Voice Profile
                </h3>

                {/* Tone */}
                <div className="mb-4">
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    TONE
                  </div>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {profile.tone}
                  </p>
                </div>

                {/* Vocabulary */}
                <div className="mb-4">
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    KEY VOCABULARY
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.vocabulary.map((word, i) => (
                      <span key={i} className="badge badge-info">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sentence Style */}
                <div className="mb-4">
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    SENTENCE STYLE
                  </div>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {profile.sentenceStyle}
                  </p>
                </div>

                {/* Do's and Don'ts */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div
                      className="text-xs font-medium mb-2"
                      style={{ color: "var(--accent-emerald)" }}
                    >
                      DO
                    </div>
                    <ul className="space-y-1">
                      {profile.doList.map((item, i) => (
                        <li
                          key={i}
                          className="text-xs flex items-start gap-1.5"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <span style={{ color: "var(--accent-emerald)" }}>
                            +
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div
                      className="text-xs font-medium mb-2"
                      style={{ color: "var(--accent-red)" }}
                    >
                      DON&apos;T
                    </div>
                    <ul className="space-y-1">
                      {profile.dontList.map((item, i) => (
                        <li
                          key={i}
                          className="text-xs flex items-start gap-1.5"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <span style={{ color: "var(--accent-red)" }}>-</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* System Prompt */}
                <div className="mb-4">
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    AI SYSTEM PROMPT
                  </div>
                  <div
                    className="rounded-md px-3 py-2 text-xs"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-primary)",
                    }}
                  >
                    {profile.systemPrompt}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveAsDefault}
                    className="btn-primary text-xs"
                  >
                    {saved ? "Saved!" : "Save as Default"}
                  </button>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        JSON.stringify(profile, null, 2)
                      )
                    }
                    className="btn-secondary text-xs"
                  >
                    Copy Profile JSON
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !profile && (
            <div
              className="card flex items-center justify-center"
              style={{ minHeight: 300 }}
            >
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Your brand voice profile will appear here after analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
