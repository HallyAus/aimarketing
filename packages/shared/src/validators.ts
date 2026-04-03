import { z } from "zod";

export const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  billingEmail: z.string().email().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

export const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  objective: z.enum(["AWARENESS", "TRAFFIC", "ENGAGEMENT", "CONVERSIONS", "LEADS"]),
  budget: z.number().positive().optional(),
  currency: z.string().length(3).default("USD"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  targetPlatforms: z.array(
    z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"])
  ).min(1),
  audienceConfig: z.record(z.unknown()).optional(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  objective: z.enum(["AWARENESS", "TRAFFIC", "ENGAGEMENT", "CONVERSIONS", "LEADS"]).optional(),
  budget: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  targetPlatforms: z.array(
    z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"])
  ).min(1).optional(),
  audienceConfig: z.record(z.unknown()).optional(),
  version: z.number().int().positive(),
});

export const createPostSchema = z.object({
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"]),
  content: z.string().min(1).max(10000),
  mediaUrls: z.array(z.string().url()).default([]),
  scheduledAt: z.string().datetime().optional(),
});

export const updatePostSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  version: z.number().int().positive(),
});

export const rejectPostSchema = z.object({
  reason: z.string().min(1).max(1000),
});

export const createCreativeSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["IMAGE", "VIDEO", "CAROUSEL", "STORY", "REEL"]),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const updateCreativeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  platform: z.enum(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "TWITTER_X", "YOUTUBE", "GOOGLE_ADS", "PINTEREST", "SNAPCHAT"]).optional(),
  content: z.string().min(1).max(10000),
  mediaUrls: z.array(z.string().url()).default([]),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

// ── RSS Feed Schemas ────────────────────────────────────────────────────
export const createRssFeedSchema = z.object({
  pageId: z.string().min(1, "pageId is required"),
  url: z.string().url("Must be a valid URL"),
  name: z.string().max(200).optional(),
  autoPost: z.boolean().default(false),
  tone: z.string().max(100).optional(),
});

export const updateRssFeedSchema = z.object({
  feedId: z.string().min(1, "feedId is required"),
  isActive: z.boolean().optional(),
  autoPost: z.boolean().optional(),
  tone: z.string().max(100).nullable().optional(),
  name: z.string().max(200).nullable().optional(),
});

// ── UTM Link Schemas ────────────────────────────────────────────────────
export const createUtmLinkSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  source: z.string().min(1).max(200),
  medium: z.string().min(1).max(200),
  campaign: z.string().min(1).max(200),
  term: z.string().max(200).optional(),
  content: z.string().max(200).optional(),
  postId: z.string().optional(),
});

// ── Webhook Rule Schemas ────────────────────────────────────────────────
export const createWebhookRuleSchema = z.object({
  name: z.string().min(1).max(200),
  trigger: z.string().min(1).max(100),
  action: z.string().min(1).max(100),
  config: z.record(z.unknown()).default({}),
  pageId: z.string().optional(),
});

export const updateWebhookRuleSchema = z.object({
  ruleId: z.string().min(1, "ruleId is required"),
  isActive: z.boolean().optional(),
  name: z.string().min(1).max(200).optional(),
  trigger: z.string().min(1).max(100).optional(),
  action: z.string().min(1).max(100).optional(),
  config: z.record(z.unknown()).optional(),
});

// ── Publish Now Schema ──────────────────────────────────────────────────
const VALID_PUBLISH_PLATFORMS = ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "TWITTER_X"] as const;

export const publishNowSchema = z.object({
  content: z.string().min(1, "content is required").max(10000),
  platform: z.enum(VALID_PUBLISH_PLATFORMS),
  connectionId: z.string().min(1, "connectionId is required"),
  campaignId: z.string().optional(),
  mediaUrls: z.array(z.string().url()).default([]),
  pageId: z.string().optional(),
  pageName: z.string().max(200).optional(),
});
