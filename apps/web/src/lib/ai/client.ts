import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });
  return _client;
}

export type AIFeature =
  | "content_generation" | "content_improvement" | "content_variation"
  | "hashtag_suggestion" | "sentiment_check" | "trending_topics"
  | "brand_voice" | "competitor_analysis" | "competitor_match"
  | "keyword_scan" | "url_to_posts" | "translate" | "repurpose"
  | "video_script" | "story_template" | "carousel" | "image_gen"
  | "email_campaign" | "landing_page" | "email_signature"
  | "ab_variants" | "community_feed" | "generate_ideas"
  | "analytics_sentiment" | "analytics_audience" | "analytics_best_times"
  | "analytics_benchmarking";

// Tasks that use Haiku (4-5x cheaper for simple tasks)
const HAIKU_FEATURES: Set<AIFeature> = new Set([
  "hashtag_suggestion", "keyword_scan", "translate", "sentiment_check",
]);

// Right-sized max_tokens per feature
const MAX_TOKENS: Partial<Record<AIFeature, number>> = {
  hashtag_suggestion: 256,
  sentiment_check: 1024,
  keyword_scan: 512,
  translate: 1024,
  trending_topics: 2048,
  ab_variants: 1024,
  story_template: 1024,
  video_script: 2048,
  content_generation: 1024,
  content_improvement: 512,
  content_variation: 1024,
  generate_ideas: 2048,
  brand_voice: 2048,
  email_signature: 2048,
  community_feed: 4096,
  competitor_match: 4096,
  competitor_analysis: 4096,
  url_to_posts: 4096,
  repurpose: 4096,
  analytics_sentiment: 4096,
  analytics_audience: 4096,
  analytics_best_times: 4096,
  analytics_benchmarking: 4096,
  carousel: 32000,
  image_gen: 16384,
  email_campaign: 8192,
  landing_page: 16384,
};

export interface CallClaudeParams {
  feature: AIFeature;
  messages: Anthropic.MessageCreateParams["messages"];
  system?: string | Anthropic.MessageCreateParams["system"];
  maxTokens?: number;
  model?: string;
  orgId?: string; // for usage tracking + budget enforcement
}

/* ── In-flight deduplication (prevents double-click waste) ────── */

const inFlight = new Map<string, Promise<Anthropic.Message>>();

function dedupeKey(params: CallClaudeParams): string {
  const msgStr = JSON.stringify(params.messages).substring(0, 200);
  return `${params.feature}:${msgStr}`;
}

/* ── Cost estimation ─────────────────────────────────────────── */

const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5-20251001": { input: 0.80, output: 4.0 },
};

function estimateCostUsd(model: string, inputTokens: number, outputTokens: number, cacheRead = 0): number {
  const p = PRICING[model] ?? PRICING["claude-sonnet-4-6"]!;
  return (inputTokens / 1_000_000) * p.input
    + (outputTokens / 1_000_000) * p.output
    + (cacheRead / 1_000_000) * p.input * 0.1; // cache reads = 10% of input price
}

/* ── Main API call function ──────────────────────────────────── */

export async function callClaude(params: CallClaudeParams): Promise<Anthropic.Message> {
  const model = params.model
    ?? (HAIKU_FEATURES.has(params.feature) ? "claude-haiku-4-5-20251001" : "claude-sonnet-4-6");
  const maxTokens = params.maxTokens ?? MAX_TOKENS[params.feature] ?? 4096;

  // Check token budget if orgId provided
  if (params.orgId) {
    const { checkTokenBudget } = await import("./usage");
    const budget = await checkTokenBudget(params.orgId);
    if (!budget.allowed) {
      throw new Error(budget.message ?? "AI usage limit reached");
    }
  }

  // Deduplicate identical in-flight requests (same feature + same message start)
  const key = dedupeKey(params);
  const existing = inFlight.get(key);
  if (existing) {
    console.log(`[ai:${params.feature}] deduplicated — reusing in-flight request`);
    return existing;
  }

  // Build system with cache_control for prompt caching
  let system: Anthropic.MessageCreateParams["system"] | undefined;
  if (typeof params.system === "string" && params.system.length > 0) {
    // Enable prompt caching on system prompt (>90% cost reduction on cache hits)
    system = [{
      type: "text" as const,
      text: params.system,
      cache_control: { type: "ephemeral" as const },
    }];
  } else if (Array.isArray(params.system)) {
    system = params.system;
  }

  const promise = getAnthropicClient().messages.create({
    model,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages: params.messages,
  });

  // Store for deduplication (remove after 30s)
  inFlight.set(key, promise);
  promise.finally(() => {
    setTimeout(() => inFlight.delete(key), 30000);
  });

  const response = await promise;

  // Log token usage with cost estimate
  const u = response.usage;
  const cacheRead = (u as unknown as Record<string, number>).cache_read_input_tokens ?? 0;
  const cacheWrite = (u as unknown as Record<string, number>).cache_creation_input_tokens ?? 0;
  const cost = estimateCostUsd(model, u.input_tokens, u.output_tokens, cacheRead);

  console.log(
    `[ai:${params.feature}] model=${response.model} in=${u.input_tokens} out=${u.output_tokens}` +
    ` cache_r=${cacheRead} cache_w=${cacheWrite}` +
    ` cost=$${cost.toFixed(4)} stop=${response.stop_reason}`,
  );

  // Record usage for budget tracking
  if (params.orgId) {
    import("./usage").then(({ recordTokenUsage }) =>
      recordTokenUsage(params.orgId!, params.feature, u.input_tokens + u.output_tokens),
    ).catch(() => {});
  }

  return response;
}

/* ── Helpers ──────────────────────────────────────────────────── */

/** Extract text from first content block */
export function extractText(response: Anthropic.Message): string {
  const block = response.content[0];
  if (block?.type !== "text") throw new Error("No text in AI response");
  return block.text;
}

/** Extract and parse JSON from response (handles markdown fences) */
export function extractJSON<T = unknown>(response: Anthropic.Message): T {
  const text = extractText(response);
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

/** Clean user input before sending (reduces token waste) */
export function trimInput(content: string, maxChars = 5000): string {
  return content
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s\n]+|[\s\n]+$/g, "")
    .slice(0, maxChars);
}

// Re-export Anthropic for types
export type { Anthropic };
