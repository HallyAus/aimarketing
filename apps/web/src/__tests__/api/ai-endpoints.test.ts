import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Shared Mocks ─────────────────────────────────────────────────────

const mockAnthropicCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: class Anthropic {
    messages = { create: mockAnthropicCreate };
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

vi.mock("@/lib/auth-middleware", () => ({
  withRole: (_role: string, handler: Function) =>
    (req: NextRequest, ctx: unknown) => {
      (req as any).orgId = "org-1";
      (req as any).userId = "user-1";
      (req as any).role = "OWNER";
      return handler(req, ctx);
    },
}));

vi.mock("@/lib/api-handler", () => ({
  withErrorHandler: (handler: Function) => handler,
  ZodValidationError: class ZodValidationError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "ZodValidationError";
    }
  },
}));

vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("fake-png")),
  })),
}));

// ── Helpers ──────────────────────────────────────────────────────────

function makeReq(url: string, body: unknown) {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const defaultCtx = { params: Promise.resolve({}) };

function mockAIResponse(jsonStr: string) {
  mockAnthropicCreate.mockResolvedValue({
    content: [{ type: "text", text: jsonStr }],
  });
}

// ── url-to-posts ─────────────────────────────────────────────────────

describe("POST /api/ai/url-to-posts", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = "test-key";
    // Mock global fetch for URL fetching
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html><body>" + "A".repeat(200) + "</body></html>"),
    }));
    const mod = await import("@/app/api/ai/url-to-posts/route");
    POST = mod.POST;
  });

  it("generates posts from URL (200)", async () => {
    mockAIResponse(JSON.stringify({
      posts: [{ platform: "Facebook", content: "Check out this!", suggestedTime: "10:00" }],
    }));

    const res = await POST(
      makeReq("/api/ai/url-to-posts", {
        url: "https://example.com/blog",
        platformIds: ["FACEBOOK"],
        postsPerPlatform: 1,
      }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.posts).toBeDefined();
  });

  it("throws on missing URL", async () => {
    await expect(
      POST(makeReq("/api/ai/url-to-posts", { platformIds: ["FACEBOOK"], postsPerPlatform: 1 }), defaultCtx),
    ).rejects.toThrow();
  });
});

// ── brand-voice ──────────────────────────────────────────────────────

describe("POST /api/ai/brand-voice", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/ai/brand-voice/route");
    POST = mod.POST;
  });

  it("analyzes brand voice (200)", async () => {
    mockAIResponse(JSON.stringify({
      tone: "Professional yet warm",
      vocabulary: ["innovate", "empower"],
      sentenceStyle: "Short and punchy",
      doList: ["Be concise"],
      dontList: ["Avoid jargon"],
      systemPrompt: "Write in a professional tone.",
    }));

    const res = await POST(
      makeReq("/api/ai/brand-voice", { samples: ["Our product empowers teams to innovate."] }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.profile.tone).toBeDefined();
  });

  it("throws on empty samples", async () => {
    await expect(
      POST(makeReq("/api/ai/brand-voice", { samples: [] }), defaultCtx),
    ).rejects.toThrow();
  });
});

// ── hashtags ─────────────────────────────────────────────────────────

describe("POST /api/ai/hashtags", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/ai/hashtags/route");
    POST = mod.POST;
  });

  it("generates hashtag research (200)", async () => {
    mockAIResponse(JSON.stringify({
      trending: [{ tag: "#ai", estimatedReach: "1M", competition: "high" }],
      niche: [],
      branded: [],
      groups: [],
    }));

    const res = await POST(
      makeReq("/api/ai/hashtags", { topic: "AI marketing", platform: "instagram" }),
      defaultCtx,
    );

    expect(res.status).toBe(200);
  });

  it("throws on missing topic", async () => {
    await expect(
      POST(makeReq("/api/ai/hashtags", { platform: "instagram" }), defaultCtx),
    ).rejects.toThrow();
  });

  it("throws on invalid platform", async () => {
    await expect(
      POST(makeReq("/api/ai/hashtags", { topic: "AI", platform: "snapchat" }), defaultCtx),
    ).rejects.toThrow();
  });
});

// ── translate ────────────────────────────────────────────────────────

describe("POST /api/ai/translate", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/ai/translate/route");
    POST = mod.POST;
  });

  it("translates content (200)", async () => {
    mockAIResponse(JSON.stringify({ Spanish: "Hola mundo", French: "Bonjour le monde" }));

    const res = await POST(
      makeReq("/api/ai/translate", {
        content: "Hello world",
        targetLanguages: ["Spanish", "French"],
      }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.translations.Spanish).toBeDefined();
  });

  it("returns 400 on missing content", async () => {
    const res = await POST(
      makeReq("/api/ai/translate", { targetLanguages: ["Spanish"] }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid languages", async () => {
    const res = await POST(
      makeReq("/api/ai/translate", { content: "hi", targetLanguages: ["Klingon"] }),
      defaultCtx,
    );

    expect(res.status).toBe(400);
  });
});

// ── repurpose ────────────────────────────────────────────────────────

describe("POST /api/ai/repurpose", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/ai/repurpose/route");
    POST = mod.POST;
  });

  it("repurposes content (200)", async () => {
    mockAIResponse(JSON.stringify({
      results: [{ format: "twitter", platform: "twitter", items: [{ content: "Shortened ver" }] }],
    }));

    const res = await POST(
      makeReq("/api/ai/repurpose", {
        content: "A long blog post about marketing strategies.",
        formats: ["twitter"],
        variationsPerFormat: 1,
      }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.results).toBeDefined();
  });

  it("throws on missing formats", async () => {
    await expect(
      POST(makeReq("/api/ai/repurpose", { content: "hi", formats: [], variationsPerFormat: 1 }), defaultCtx),
    ).rejects.toThrow();
  });
});

// ── ab-variants ──────────────────────────────────────────────────────

describe("POST /api/ai/ab-variants", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/ai/ab-variants/route");
    POST = mod.POST;
  });

  it("generates A/B variants (200)", async () => {
    mockAIResponse(JSON.stringify({
      variants: [
        { content: "Variant A", strategy: "Question hook", changes: ["Added question"] },
        { content: "Variant B", strategy: "Urgency", changes: ["Added deadline"] },
      ],
    }));

    const res = await POST(
      makeReq("/api/ai/ab-variants", { content: "Original post", platform: "FACEBOOK", numVariants: 2 }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.variants).toHaveLength(2);
  });

  it("throws on missing content", async () => {
    await expect(
      POST(makeReq("/api/ai/ab-variants", { platform: "FACEBOOK", numVariants: 2 }), defaultCtx),
    ).rejects.toThrow();
  });
});

// ── carousel ─────────────────────────────────────────────────────────

describe("POST /api/ai/carousel", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/ai/carousel/route");
    POST = mod.POST;
  });

  it("generates carousel slides (200)", async () => {
    mockAIResponse(JSON.stringify({
      slides: [
        { slideNumber: 1, title: "Hook", body: "Grab attention", cta: null, imagePrompt: "Bright bg" },
      ],
    }));

    const res = await POST(
      makeReq("/api/ai/carousel", { topic: "5 Marketing Tips", platform: "instagram", numSlides: 5 }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.slides).toBeDefined();
  });

  it("throws on invalid platform", async () => {
    await expect(
      POST(makeReq("/api/ai/carousel", { topic: "Tips", platform: "tiktok", numSlides: 3 }), defaultCtx),
    ).rejects.toThrow();
  });
});

// ── story-template ───────────────────────────────────────────────────

describe("POST /api/ai/story-template", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/ai/story-template/route");
    POST = mod.POST;
  });

  it("generates story template (200)", async () => {
    mockAIResponse(JSON.stringify({
      textOverlay: "Check this out!",
      caption: "Our latest product",
      hashtags: ["#new"],
      musicSuggestion: "upbeat pop",
      tips: ["Use natural lighting"],
    }));

    const res = await POST(
      makeReq("/api/ai/story-template", { category: "product-launch", topic: "New shoes", platform: "instagram" }),
      defaultCtx,
    );

    expect(res.status).toBe(200);
  });

  it("throws on missing fields", async () => {
    await expect(
      POST(makeReq("/api/ai/story-template", { category: "promo" }), defaultCtx),
    ).rejects.toThrow();
  });
});

// ── video-script ─────────────────────────────────────────────────────

describe("POST /api/ai/video-script", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/ai/video-script/route");
    POST = mod.POST;
  });

  it("generates video script (200)", async () => {
    mockAIResponse(JSON.stringify({
      hook: "Did you know...",
      body: "[SHOT: Product close-up]",
      cta: "Follow for more!",
      onScreenText: ["Tip 1"],
      musicMood: "upbeat",
      fullScript: "[0:00-0:03] Hook...",
      tips: ["Use good lighting"],
    }));

    const res = await POST(
      makeReq("/api/ai/video-script", {
        topic: "Marketing tips",
        platform: "tiktok",
        duration: "30s",
        style: "tutorial",
      }),
      defaultCtx,
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.script.hook).toBeDefined();
  });

  it("throws on invalid duration", async () => {
    await expect(
      POST(
        makeReq("/api/ai/video-script", {
          topic: "Tips",
          platform: "tiktok",
          duration: "2h",
          style: "tutorial",
        }),
        defaultCtx,
      ),
    ).rejects.toThrow();
  });
});

// ── trending ─────────────────────────────────────────────────────────

describe("POST /api/ai/trending", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/ai/trending/route");
    POST = mod.POST;
  });

  it("generates trending topics (200)", async () => {
    mockAIResponse(JSON.stringify({
      topics: [{ title: "AI Boom", description: "AI is trending", relevance: "High", suggestedAngle: "Blog", hashtags: ["#ai"] }],
    }));

    const res = await POST(
      makeReq("/api/ai/trending", { niche: "digital marketing" }),
      defaultCtx,
    );

    expect(res.status).toBe(200);
  });

  it("throws on missing niche", async () => {
    await expect(
      POST(makeReq("/api/ai/trending", {}), defaultCtx),
    ).rejects.toThrow();
  });
});

// ── competitor-analysis ──────────────────────────────────────────────

describe("POST /api/ai/competitor-analysis", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-stub fetch for competitor URL fetching
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html><body>Competitor content here</body></html>"),
    }));
    const mod = await import("@/app/api/ai/competitor-analysis/route");
    POST = mod.POST;
  });

  it("analyzes competitor (200)", async () => {
    mockAIResponse(JSON.stringify({
      contentThemes: ["Innovation"],
      postingFrequency: "Daily",
      toneAnalysis: "Professional",
      topContentTypes: ["Video"],
      engagementStrategies: ["Q&A"],
      strengths: ["Brand recognition"],
      weaknesses: ["Slow response"],
      recommendations: ["Post more often"],
    }));

    const res = await POST(
      makeReq("/api/ai/competitor-analysis", { url: "https://competitor.com" }),
      defaultCtx,
    );

    expect(res.status).toBe(200);
  });

  it("throws on missing URL", async () => {
    await expect(
      POST(makeReq("/api/ai/competitor-analysis", {}), defaultCtx),
    ).rejects.toThrow();
  });
});

// ── image-gen ────────────────────────────────────────────────────────

describe("POST /api/ai/image-gen", () => {
  let POST: Function;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/app/api/ai/image-gen/route");
    POST = mod.POST;
  });

  it("generates an image (200 PNG)", async () => {
    const res = await POST(
      makeReq("/api/ai/image-gen", { prompt: "A beautiful sunset", style: "flat-design", size: "instagram-square" }),
      defaultCtx,
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
  });

  it("throws on missing prompt", async () => {
    await expect(
      POST(makeReq("/api/ai/image-gen", {}), defaultCtx),
    ).rejects.toThrow();
  });
});
