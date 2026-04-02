"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";

const LANGUAGES = [
  "Spanish", "French", "German", "Japanese", "Chinese",
  "Portuguese", "Arabic", "Korean", "Italian", "Dutch",
];

export default function TranslatePage() {
  const [content, setContent] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [tone, setTone] = useState("professional");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const toggleLang = (lang: string) => {
    setSelectedLangs(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleTranslate = async () => {
    if (!content || !selectedLangs.length) return;
    setLoading(true);
    setError("");
    setTranslations({});
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, targetLanguages: selectedLangs, tone }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Translation failed");
      }
      const data = await res.json();
      setTranslations(data.translations ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard");
    setTimeout(() => setSuccess(""), 2000);
  };

  const scheduleAll = () => {
    setSuccess("All translations queued for scheduling (placeholder). Navigate to Calendar to finalize times.");
    setTimeout(() => setSuccess(""), 4000);
  };

  return (
    <div>
      <PageHeader title="Multi-Language Translate" subtitle="AI-translate posts while preserving tone and hashtags" />

      {success && <div className="alert alert-success mb-4">{success}</div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Input panel */}
        <div className="card">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Original Content</h3>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste your post content here..."
            rows={6}
            className="w-full mb-4"
          />

          <div className="mb-4">
            <label className="block text-xs text-[var(--text-secondary)] mb-2">Tone</label>
            <select value={tone} onChange={e => setTone(e.target.value)} className="w-full">
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="witty">Witty</option>
              <option value="informative">Informative</option>
              <option value="inspiring">Inspiring</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-[var(--text-secondary)] mb-2">Target Languages</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => toggleLang(lang)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    selectedLangs.includes(lang)
                      ? "bg-[var(--accent-blue-muted)] border-[var(--accent-blue)] text-[var(--accent-blue)]"
                      : "border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedLangs(selectedLangs.length === LANGUAGES.length ? [] : [...LANGUAGES])}
              className="text-xs text-[var(--accent-blue)] mt-2 hover:underline"
            >
              {selectedLangs.length === LANGUAGES.length ? "Deselect all" : "Select all"}
            </button>
          </div>

          <button
            onClick={handleTranslate}
            disabled={loading || !content || !selectedLangs.length}
            className="btn-primary w-full"
          >
            {loading ? "Translating..." : `Translate to ${selectedLangs.length} language(s)`}
          </button>
        </div>

        {/* Results panel */}
        <div>
          {Object.keys(translations).length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Translations</h3>
                <button onClick={scheduleAll} className="btn-primary text-xs">
                  Schedule All Translations
                </button>
              </div>
              {Object.entries(translations).map(([lang, text]) => (
                <div key={lang} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge badge-info text-[10px]">{lang}</span>
                    <button
                      onClick={() => copyToClipboard(text)}
                      className="btn-ghost text-xs"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="card flex items-center justify-center h-64">
              <p className="text-sm text-[var(--text-tertiary)]">
                {loading ? "Translating your content..." : "Translations will appear here"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
