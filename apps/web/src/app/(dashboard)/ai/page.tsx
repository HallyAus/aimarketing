"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";

/* ── Shared action buttons for AI output ─────────────────── */

function AiOutputActions({
  content,
  platform,
  showPostNow,
}: {
  content: string;
  platform?: string;
  showPostNow?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [connections, setConnections] = useState<Array<{ id: string; platform: string; platformAccountName: string | null }>>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [publishing, setPublishing] = useState(false);

  async function saveAsDraft() {
    setSaving(true);
    setFeedback("");
    try {
      const res = await fetch("/api/ai/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, platform: platform ?? "INSTAGRAM" }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setFeedback("Saved as draft!");
    } catch {
      setFeedback("Error saving draft");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(""), 3000);
    }
  }

  async function schedulePost() {
    setScheduling(true);
    setFeedback("");
    try {
      const res = await fetch("/api/posts/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drafts: [{ content, platform: platform ?? "INSTAGRAM" }],
        }),
      });
      if (!res.ok) throw new Error("Failed to schedule");
      const data = await res.json();
      const time = data.scheduled?.[0]?.scheduledAt;
      setFeedback(time ? `Scheduled for ${new Date(time).toLocaleString()}` : "Scheduled!");
    } catch {
      setFeedback("Error scheduling post");
    } finally {
      setScheduling(false);
      setTimeout(() => setFeedback(""), 4000);
    }
  }

  async function openPublishModal() {
    setShowPublishModal(true);
    try {
      const res = await fetch("/api/connections");
      const data = await res.json();
      setConnections(data.data ?? []);
      const match = (data.data ?? []).find((c: { platform: string }) => c.platform === (platform ?? "INSTAGRAM"));
      if (match) setSelectedConnectionId(match.id);
    } catch { /* ignore */ }
  }

  async function publishNow() {
    if (!selectedConnectionId) return;
    setPublishing(true);
    setFeedback("");
    try {
      const res = await fetch("/api/posts/publish-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          platform: platform ?? "INSTAGRAM",
          connectionId: selectedConnectionId,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      setFeedback("Posted successfully!");
      setShowPublishModal(false);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Error posting");
    } finally {
      setPublishing(false);
      setTimeout(() => setFeedback(""), 4000);
    }
  }

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2 items-center">
        <button
          onClick={() => navigator.clipboard.writeText(content)}
          className="text-sm"
          style={{ color: "var(--accent-blue)" }}
        >
          Copy
        </button>
        <button
          onClick={saveAsDraft}
          disabled={saving}
          className="btn-secondary text-xs"
        >
          {saving ? "Saving..." : "Save as Draft"}
        </button>
        <button
          onClick={schedulePost}
          disabled={scheduling}
          className="btn-secondary text-xs"
        >
          {scheduling ? "Scheduling..." : "Schedule"}
        </button>
        {showPostNow && (
          <button
            onClick={openPublishModal}
            className="btn-primary text-xs"
          >
            Post Now
          </button>
        )}
        {feedback && (
          <span className="text-xs font-medium" style={{ color: "var(--accent-emerald)" }}>
            {feedback}
          </span>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="modal-overlay" onClick={() => setShowPublishModal(false)} role="dialog" aria-modal="true" aria-label="Publish post">
          <div onClick={e => e.stopPropagation()} className="modal-panel">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Post Now</h2>
            <p className="text-xs mb-3 truncate" style={{ color: "var(--text-tertiary)" }}>{content.substring(0, 100)}...</p>
            <label htmlFor="ai-pub-conn" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Connection</label>
            <select
              id="ai-pub-conn"
              value={selectedConnectionId}
              onChange={e => setSelectedConnectionId(e.target.value)}
              className="w-full mb-4"
            >
              <option value="">Select connection</option>
              {connections.map(c => (
                <option key={c.id} value={c.id}>{c.platformAccountName ?? c.platform}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowPublishModal(false)} className="btn-secondary min-h-[44px]">Cancel</button>
              <button onClick={publishNow} disabled={publishing || !selectedConnectionId} className="btn-primary min-h-[44px]">
                {publishing ? "Posting..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"];
const TONES = ["professional", "casual", "humorous", "urgent", "inspirational", "educational"];
const IMAGE_PRESETS = [
  { id: "instagram-square", label: "Instagram Square (1080x1080)" },
  { id: "instagram-story", label: "Instagram Story (1080x1920)" },
  { id: "facebook-post", label: "Facebook Post (1200x630)" },
  { id: "twitter-post", label: "Twitter Post (1200x675)" },
  { id: "linkedin-post", label: "LinkedIn Post (1200x627)" },
  { id: "tiktok-cover", label: "TikTok Cover (1080x1920)" },
  { id: "youtube-thumbnail", label: "YouTube Thumbnail (1280x720)" },
  { id: "pinterest-pin", label: "Pinterest Pin (1000x1500)" },
];

export default function AIStudioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"post" | "improve" | "ideas" | "image">("post");

  return (
    <div>
      <PageHeader
        title="AI Studio"
        subtitle="Generate content, images, and campaign ideas with AI."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "AI Studio" },
        ]}
      />

      {/* Inline tabs */}
      <div className="tab-bar mb-6 overflow-x-auto" role="tablist" aria-label="AI Studio tools">
        {[
          { id: "post" as const, label: "Generate Post" },
          { id: "improve" as const, label: "Improve Post" },
          { id: "ideas" as const, label: "Campaign Ideas" },
          { id: "image" as const, label: "Create Image" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab-item ${activeTab === tab.id ? "tab-item-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "post" && <GeneratePostTab />}
      {activeTab === "improve" && <ImprovePostTab />}
      {activeTab === "ideas" && <CampaignIdeasTab />}
      {activeTab === "image" && <CreateImageTab />}

      {/* More Tools section */}
      <div className="mt-10">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>More Tools</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[
            { href: "/ai/brand-voice", label: "Brand Voice", icon: "M12 18.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 5.5h8M8 9h8M10 12.5h4" },
            { href: "/ai/competitor-spy", label: "Competitor Spy", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" },
            { href: "/ai/hashtags", label: "Hashtags", icon: "M7 20l4-16m2 16l4-16M6 9h14M4 15h14" },
            { href: "/ai/image-gen", label: "Image Gen", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
            { href: "/ai/video-scripts", label: "Video Scripts", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
            { href: "/ai/url-to-posts", label: "URL to Posts", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
            { href: "/ai/bulk-generate", label: "Bulk Generate", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
            { href: "/ai/repurpose", label: "Repurpose", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
            { href: "/ai/ab-test", label: "A/B Variants", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { href: "/ai/carousel", label: "Carousel", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
            { href: "/ai/templates-ai", label: "Story Templates", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
          ].map((tool) => (
            <button
              key={tool.href}
              onClick={() => router.push(tool.href)}
              className="card flex flex-col items-center gap-2 p-4 text-center transition-all hover:ring-1"
              style={{ cursor: "pointer", border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent-blue)" }}>
                <path d={tool.icon} />
              </svg>
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GeneratePostTab() {
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, topic, tone, includeHashtags, includeEmojis }),
      });
      const data = await res.json();
      setResult(data.content ?? data.error);
    } catch {
      setResult("Error generating content");
    }
    setLoading(false);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="gen-platform" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Platform</label>
          <select id="gen-platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
            {PLATFORMS.map((p) => <option key={p} value={p}>{p.replaceAll("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="gen-topic" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Topic / Description</label>
          <textarea
            id="gen-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            placeholder="e.g. Summer sale on all products, 30% off, limited time only"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="gen-tone" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tone</label>
          <select id="gen-tone" value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
            {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm min-h-[44px]" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={includeHashtags} onChange={(e) => setIncludeHashtags(e.target.checked)} className="w-4 h-4" />
            Include hashtags
          </label>
          <label className="flex items-center gap-2 text-sm min-h-[44px]" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={includeEmojis} onChange={(e) => setIncludeEmojis(e.target.checked)} className="w-4 h-4" />
            Include emojis
          </label>
        </div>
        <button
          onClick={generate}
          disabled={loading || !topic}
          className="btn-primary text-sm disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
        >
          {loading ? "Generating..." : "Generate Post"}
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Generated Content</label>
        <div
          className="rounded-lg p-4 min-h-[200px] whitespace-pre-wrap text-sm"
          aria-live="polite"
          aria-busy={loading}
          style={{
            border: "1px solid var(--border-primary)",
            background: "var(--bg-secondary)",
            color: result ? "var(--text-primary)" : "var(--text-tertiary)",
          }}
        >
          {result || "Your AI-generated post will appear here..."}
        </div>
        {result && (
          <AiOutputActions content={result} platform={platform} showPostNow />
        )}
      </div>
    </div>
  );
}

function ImprovePostTab() {
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [content, setContent] = useState("");
  const [instruction, setInstruction] = useState("Make it more engaging and add a call to action");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function improve() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/improve-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, platform, instruction }),
      });
      const data = await res.json();
      setResult(data.content ?? data.error);
    } catch {
      setResult("Error improving content");
    }
    setLoading(false);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="improve-platform" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Platform</label>
          <select id="improve-platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
            {PLATFORMS.map((p) => <option key={p} value={p}>{p.replaceAll("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="improve-content" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Current Post Content</label>
          <textarea
            id="improve-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Paste your existing post here..."
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="improve-instructions" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Improvement Instructions</label>
          <input
            id="improve-instructions"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={improve}
          disabled={loading || !content}
          className="btn-primary text-sm disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
        >
          {loading ? "Improving..." : "Improve Post"}
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Improved Content</label>
        <div
          className="rounded-lg p-4 min-h-[200px] whitespace-pre-wrap text-sm"
          aria-live="polite"
          aria-busy={loading}
          style={{
            border: "1px solid var(--border-primary)",
            background: "var(--bg-secondary)",
            color: result ? "var(--text-primary)" : "var(--text-tertiary)",
          }}
        >
          {result || "Improved version will appear here..."}
        </div>
        {result && (
          <AiOutputActions content={result} platform={platform} />
        )}
      </div>
    </div>
  );
}

function CampaignIdeasTab() {
  const [industry, setIndustry] = useState("");
  const [objective, setObjective] = useState("ENGAGEMENT");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, objective, platforms: ["FACEBOOK", "INSTAGRAM", "TIKTOK"] }),
      });
      const data = await res.json();
      setResult(data.ideas ?? data.error);
    } catch {
      setResult("Error generating ideas");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl w-full space-y-4">
      <div>
        <label htmlFor="ideas-industry" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Your Industry / Business</label>
        <input
          id="ideas-industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. E-commerce fashion brand, SaaS startup, Local restaurant"
          className="w-full rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="ideas-objective" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Campaign Objective</label>
        <select id="ideas-objective" value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
          <option value="AWARENESS">Brand Awareness</option>
          <option value="TRAFFIC">Website Traffic</option>
          <option value="ENGAGEMENT">Engagement</option>
          <option value="CONVERSIONS">Conversions / Sales</option>
          <option value="LEADS">Lead Generation</option>
        </select>
      </div>
      <button
        onClick={generate}
        disabled={loading || !industry}
        className="btn-primary text-sm disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
      >
        {loading ? "Generating Ideas..." : "Generate Campaign Ideas"}
      </button>
      {result && (
        <>
          <div
            className="rounded-lg p-4 whitespace-pre-wrap text-sm mt-4"
            aria-live="polite"
            style={{
              border: "1px solid var(--border-primary)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
            }}
          >
            {result}
          </div>
          <AiOutputActions content={result} />
        </>
      )}
    </div>
  );
}

function CreateImageTab() {
  const [text, setText] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [preset, setPreset] = useState("instagram-square");
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState("large");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateImage() {
    setLoading(true);
    setImageUrl("");
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, subtitle, preset, bgColor, textColor, fontSize }),
      });
      if (res.ok) {
        const blob = await res.blob();
        setImageUrl(URL.createObjectURL(blob));
      }
    } catch {
      // Error
    }
    setLoading(false);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="img-text" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Main Text</label>
          <textarea
            id="img-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Your headline or caption text"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="img-subtitle" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Subtitle (optional)</label>
          <input
            id="img-subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Additional line of text"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="img-preset" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Size Preset</label>
          <select id="img-preset" value={preset} onChange={(e) => setPreset(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
            {IMAGE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="img-bgcolor" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Background</label>
            <div className="flex gap-2">
              <input
                id="img-bgcolor"
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-9 w-12 rounded cursor-pointer"
                style={{ border: "1px solid var(--border-primary)" }}
              />
              <input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                aria-label="Background color hex value"
                className="flex-1 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="img-textcolor" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Text Color</label>
            <div className="flex gap-2">
              <input
                id="img-textcolor"
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-9 w-12 rounded cursor-pointer"
                style={{ border: "1px solid var(--border-primary)" }}
              />
              <input
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                aria-label="Text color hex value"
                className="flex-1 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="img-fontsize" className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Font Size</label>
          <select id="img-fontsize" value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra Large</option>
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["#1a1a2e", "#000000", "#16213e", "#0f3460", "#533483", "#e94560", "#1b4332", "#2d3436"].map((c) => (
            <button
              key={c}
              onClick={() => setBgColor(c)}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                border: bgColor === c ? "2px solid var(--accent-blue)" : "2px solid var(--border-primary)",
              }}
              aria-label={`Set background color to ${c}`}
            />
          ))}
        </div>
        <button
          onClick={generateImage}
          disabled={loading || !text}
          className="btn-primary text-sm disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
        >
          {loading ? "Creating..." : "Create Image"}
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Preview</label>
        <div
          className="rounded-lg overflow-hidden min-h-[200px] sm:min-h-[300px] flex items-center justify-center"
          style={{ border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={`Generated image: ${text.substring(0, 80)}`} width={1024} height={1024} className="max-w-full max-h-[500px] object-contain" />
          ) : (
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Image preview will appear here
            </span>
          )}
        </div>
        {imageUrl && (
          <a
            href={imageUrl}
            download="adpilot-image.png"
            className="mt-2 inline-block text-sm"
            style={{ color: "var(--accent-blue)" }}
          >
            Download Image
          </a>
        )}
      </div>
    </div>
  );
}
