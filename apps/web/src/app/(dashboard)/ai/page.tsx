"use client";

import { useState } from "react";

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
  const [activeTab, setActiveTab] = useState<"post" | "improve" | "ideas" | "image">("post");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">AI Studio</h1>
      <p className="text-gray-500 mb-6">Generate content, images, and campaign ideas with AI.</p>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6">
        {[
          { id: "post" as const, label: "Generate Post" },
          { id: "improve" as const, label: "Improve Post" },
          { id: "ideas" as const, label: "Campaign Ideas" },
          { id: "image" as const, label: "Create Image" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
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
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
            {PLATFORMS.map((p) => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Topic / Description</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            placeholder="e.g. Summer sale on all products, 30% off, limited time only"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
            {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeHashtags} onChange={(e) => setIncludeHashtags(e.target.checked)} />
            Include hashtags
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeEmojis} onChange={(e) => setIncludeEmojis(e.target.checked)} />
            Include emojis
          </label>
        </div>
        <button onClick={generate} disabled={loading || !topic} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Generating..." : "Generate Post"}
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Generated Content</label>
        <div className="border rounded-lg p-4 min-h-[200px] bg-gray-50 whitespace-pre-wrap text-sm">
          {result || "Your AI-generated post will appear here..."}
        </div>
        {result && (
          <button onClick={() => navigator.clipboard.writeText(result)} className="mt-2 text-sm text-blue-600 hover:underline">
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
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
            {PLATFORMS.map((p) => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Current Post Content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="Paste your existing post here..." className="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Improvement Instructions</label>
          <input value={instruction} onChange={(e) => setInstruction(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <button onClick={improve} disabled={loading || !content} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Improving..." : "Improve Post"}
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Improved Content</label>
        <div className="border rounded-lg p-4 min-h-[200px] bg-gray-50 whitespace-pre-wrap text-sm">
          {result || "Improved version will appear here..."}
        </div>
        {result && (
          <button onClick={() => navigator.clipboard.writeText(result)} className="mt-2 text-sm text-blue-600 hover:underline">
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
    <div className="max-w-2xl space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Your Industry / Business</label>
        <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. E-commerce fashion brand, SaaS startup, Local restaurant" className="w-full rounded-md border px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Campaign Objective</label>
        <select value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
          <option value="AWARENESS">Brand Awareness</option>
          <option value="TRAFFIC">Website Traffic</option>
          <option value="ENGAGEMENT">Engagement</option>
          <option value="CONVERSIONS">Conversions / Sales</option>
          <option value="LEADS">Lead Generation</option>
        </select>
      </div>
      <button onClick={generate} disabled={loading || !industry} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Generating Ideas..." : "Generate Campaign Ideas"}
      </button>
      {result && (
        <div className="border rounded-lg p-4 bg-gray-50 whitespace-pre-wrap text-sm mt-4">
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
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Main Text</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Your headline or caption text" className="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subtitle (optional)</label>
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Additional line of text" className="w-full rounded-md border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Size Preset</label>
          <select value={preset} onChange={(e) => setPreset(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
            {IMAGE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Background</label>
            <div className="flex gap-2">
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
              <input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 rounded-md border px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Text Color</label>
            <div className="flex gap-2">
              <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
              <input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="flex-1 rounded-md border px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Font Size</label>
          <select value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xlarge">Extra Large</option>
          </select>
        </div>
        <div className="flex gap-2">
          {["#1a1a2e", "#000000", "#16213e", "#0f3460", "#533483", "#e94560", "#1b4332", "#2d3436"].map((c) => (
            <button key={c} onClick={() => setBgColor(c)} className="w-8 h-8 rounded-full border-2 border-gray-200" style={{ backgroundColor: c }} />
          ))}
        </div>
        <button onClick={generateImage} disabled={loading || !text} className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Creating..." : "Create Image"}
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Preview</label>
        <div className="border rounded-lg overflow-hidden bg-gray-100 min-h-[300px] flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="Generated" className="max-w-full max-h-[500px] object-contain" />
          ) : (
            <span className="text-gray-400 text-sm">Image preview will appear here</span>
          )}
        </div>
        {imageUrl && (
          <a href={imageUrl} download="adpilot-image.png" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            Download Image
          </a>
        )}
      </div>
    </div>
  );
}
