"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>AI Studio</h1>
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
        Generate content, images, and campaign ideas with AI.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto" style={{ borderBottom: "1px solid var(--border-primary)" }}>
        {[
          { id: "post" as const, label: "Generate Post" },
          { id: "improve" as const, label: "Improve Post" },
          { id: "ideas" as const, label: "Campaign Ideas" },
          { id: "image" as const, label: "Create Image" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium whitespace-nowrap min-h-[44px]"
            style={{
              borderBottom: activeTab === tab.id ? "2px solid var(--accent-blue)" : "2px solid transparent",
              marginBottom: "-1px",
              color: activeTab === tab.id ? "var(--accent-blue)" : "var(--text-secondary)",
              background: "transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => router.push("/ai/url-to-posts")}
          className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium whitespace-nowrap min-h-[44px]"
          style={{
            borderBottom: "2px solid transparent",
            marginBottom: "-1px",
            color: "var(--text-secondary)",
            background: "transparent",
          }}
        >
          URL to Posts
        </button>
      </div>

      {activeTab === "post" && <GeneratePostTab />}
      {activeTab === "improve" && <ImprovePostTab />}
      {activeTab === "ideas" && <CampaignIdeasTab />}
      {activeTab === "image" && <CreateImageTab />}
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
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
            {PLATFORMS.map((p) => <option key={p} value={p}>{p.replaceAll("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Topic / Description</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            placeholder="e.g. Summer sale on all products, 30% off, limited time only"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
            {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={includeHashtags} onChange={(e) => setIncludeHashtags(e.target.checked)} />
            Include hashtags
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={includeEmojis} onChange={(e) => setIncludeEmojis(e.target.checked)} />
            Include emojis
          </label>
        </div>
        <button
          onClick={generate}
          disabled={loading || !topic}
          className="btn-primary text-sm disabled:opacity-50 min-h-[44px]"
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
          <button
            onClick={() => navigator.clipboard.writeText(result)}
            className="mt-2 text-sm"
            style={{ color: "var(--accent-blue)" }}
          >
            Copy to clipboard
          </button>
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
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
            {PLATFORMS.map((p) => <option key={p} value={p}>{p.replaceAll("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Current Post Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Paste your existing post here..."
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Improvement Instructions</label>
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={improve}
          disabled={loading || !content}
          className="btn-primary text-sm disabled:opacity-50 min-h-[44px]"
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
          <button
            onClick={() => navigator.clipboard.writeText(result)}
            className="mt-2 text-sm"
            style={{ color: "var(--accent-blue)" }}
          >
            Copy to clipboard
          </button>
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
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Your Industry / Business</label>
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. E-commerce fashion brand, SaaS startup, Local restaurant"
          className="w-full rounded-md px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Campaign Objective</label>
        <select value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
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
        className="btn-primary text-sm disabled:opacity-50"
      >
        {loading ? "Generating Ideas..." : "Generate Campaign Ideas"}
      </button>
      {result && (
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
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Main Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Your headline or caption text"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Subtitle (optional)</label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Additional line of text"
            className="w-full rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Size Preset</label>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
            {IMAGE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Background</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-9 w-12 rounded cursor-pointer"
                style={{ border: "1px solid var(--border-primary)" }}
              />
              <input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="flex-1 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-9 w-12 rounded cursor-pointer"
                style={{ border: "1px solid var(--border-primary)" }}
              />
              <input
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="flex-1 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Font Size</label>
          <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra Large</option>
          </select>
        </div>
        <div className="flex gap-2">
          {["#1a1a2e", "#000000", "#16213e", "#0f3460", "#533483", "#e94560", "#1b4332", "#2d3436"].map((c) => (
            <button
              key={c}
              onClick={() => setBgColor(c)}
              className="w-8 h-8 rounded-full"
              style={{ backgroundColor: c, border: "2px solid var(--border-primary)" }}
            />
          ))}
        </div>
        <button
          onClick={generateImage}
          disabled={loading || !text}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Image"}
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Preview</label>
        <div
          className="rounded-lg overflow-hidden min-h-[300px] flex items-center justify-center"
          style={{ border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="Generated" width={1024} height={1024} className="max-w-full max-h-[500px] object-contain" />
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
