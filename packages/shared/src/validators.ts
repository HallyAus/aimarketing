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
