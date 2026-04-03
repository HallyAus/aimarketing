import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "",
    });
  }
  return _client;
}

export async function generatePostContent(params: {
  platform: string;
  topic: string;
  tone?: string;
  style?: string;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  maxLength?: number;
  customPrompt?: string;
  brandVoicePrompt?: string;
  businessContext?: string;
  contentMemory?: string;
}): Promise<string> {
  const { platform, topic, tone = "professional", style = "engaging", includeHashtags = true, includeEmojis = true, maxLength, customPrompt, brandVoicePrompt, businessContext, contentMemory } = params;

  const platformLimits: Record<string, number> = {
    TWITTER_X: 280,
    LINKEDIN: 3000,
    FACEBOOK: 2000,
    INSTAGRAM: 2200,
    TIKTOK: 2200,
    YOUTUBE: 5000,
    PINTEREST: 500,
    SNAPCHAT: 250,
    GOOGLE_ADS: 90,
  };

  const charLimit = maxLength ?? platformLimits[platform] ?? 2000;

  // Build system prompt from brand voice
  const systemParts: string[] = [];
  if (brandVoicePrompt) systemParts.push(`Brand Voice Instructions: ${brandVoicePrompt}`);
  if (businessContext) systemParts.push(`Business Context: ${businessContext}`);
  const systemPrompt = systemParts.length ? systemParts.join("\n\n") : undefined;

  // Build user prompt
  let userContent: string;
  if (customPrompt) {
    userContent = `${customPrompt}

Platform: ${platform.replace("_", " ")}
${topic ? `Additional context/topic: ${topic}` : ""}
${tone ? `Preferred tone: ${tone}` : ""}
- Maximum ${charLimit} characters
${includeHashtags ? "- Include 3-5 relevant hashtags" : "- No hashtags"}
${includeEmojis ? "- Use emojis appropriately" : "- No emojis"}
- Optimized for ${platform.replace("_", " ")} engagement
- Ready to post as-is (no explanations, just the post content)

Write ONLY the post content, nothing else.${contentMemory}`;
  } else {
    userContent = `Write a ${platform.replace("_", " ")} post about: ${topic}

Requirements:
- Tone: ${tone}
- Style: ${style}
- Maximum ${charLimit} characters
${includeHashtags ? "- Include 3-5 relevant hashtags" : "- No hashtags"}
${includeEmojis ? "- Use emojis appropriately" : "- No emojis"}
- Optimized for ${platform.replace("_", " ")} engagement
- Ready to post as-is (no explanations, just the post content)

Write ONLY the post content, nothing else.${contentMemory}`;
  }

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    { role: "user", content: userContent },
  ];

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages,
  });

  const text = response.content[0];
  if (text?.type === "text") {
    return text.text.trim();
  }
  throw new Error("No text in AI response");
}

export async function generateCampaignIdeas(params: {
  industry: string;
  objective: string;
  platforms: string[];
  count?: number;
}): Promise<string> {
  const { industry, objective, platforms, count = 5 } = params;

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate ${count} marketing campaign ideas for a ${industry} business.

Objective: ${objective}
Target platforms: ${platforms.join(", ")}

For each idea, provide:
1. Campaign name
2. Brief description (2-3 sentences)
3. Suggested post types
4. Recommended schedule

Format as a numbered list. Be specific and actionable.`,
      },
    ],
  });

  const text = response.content[0];
  if (text?.type === "text") return text.text.trim();
  throw new Error("No text in AI response");
}

export async function improvePostContent(params: {
  content: string;
  platform: string;
  instruction?: string;
}): Promise<string> {
  const { content, platform, instruction = "Make it more engaging" } = params;

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Improve this ${platform.replace("_", " ")} post. ${instruction}

Original post:
${content}

Write ONLY the improved post content, nothing else.`,
      },
    ],
  });

  const text = response.content[0];
  if (text?.type === "text") return text.text.trim();
  throw new Error("No text in AI response");
}
