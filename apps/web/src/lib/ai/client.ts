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

// Tasks that can use Haiku (cheaper, simpler tasks)
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
}

export async function callClaude(params: CallClaudeParams): Promise<Anthropic.Message> {
  const model = params.model
    ?? (HAIKU_FEATURES.has(params.feature) ? "claude-haiku-4-5-20251001" : "claude-sonnet-4-6");
  const maxTokens = params.maxTokens ?? MAX_TOKENS[params.feature] ?? 4096;

  const response = await getAnthropicClient().messages.create({
    model,
    max_tokens: maxTokens,
    ...(params.system ? { system: params.system } : {}),
    messages: params.messages,
  });

  // Log token usage
  const u = response.usage;
  console.log(
    `[ai:${params.feature}] model=${response.model} in=${u.input_tokens} out=${u.output_tokens} total=${u.input_tokens + u.output_tokens} stop=${response.stop_reason}`,
  );

  return response;
}

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

// Re-export Anthropic for types
export type { Anthropic };
