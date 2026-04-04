import type { MetadataRoute } from "next";

const CITY_SLUGS = [
  "sydney", "melbourne", "brisbane", "perth", "adelaide", "gold-coast",
  "canberra", "newcastle", "hobart", "darwin", "sunshine-coast", "wollongong",
  "geelong", "cairns", "townsville", "toowoomba", "ballarat", "bendigo",
  "central-coast", "launceston", "mackay", "rockhampton", "bunbury",
  "mandurah", "wagga-wagga", "albury", "mildura", "shepparton",
  "gladstone", "hervey-bay",
];

const BLOG_SLUGS = [
  "5-ways-ai-changing-social-media-marketing",
  "manage-9-social-platforms",
  "ai-generated-content-sounds-human",
  "scheduling-posts-across-timezones",
  "why-we-built-reachpilot",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://reachpilot.app";
  const now = new Date("2026-04-03");

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/marketing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/docs`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/status`, lastModified: now, changeFrequency: "daily", priority: 0.3 },
    { url: `${baseUrl}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/security`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  const blogPages: MetadataRoute.Sitemap = BLOG_SLUGS.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const cityPages: MetadataRoute.Sitemap = CITY_SLUGS.map((slug) => ({
    url: `${baseUrl}/marketing/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages, ...cityPages];
}
