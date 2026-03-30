import type { MetadataRoute } from "next";

const CITY_SLUGS = [
  "sydney", "melbourne", "brisbane", "perth", "adelaide", "gold-coast",
  "canberra", "newcastle", "hobart", "darwin", "sunshine-coast", "wollongong",
  "geelong", "cairns", "townsville", "toowoomba", "ballarat", "bendigo",
  "central-coast", "launceston", "mackay", "rockhampton", "bunbury",
  "mandurah", "wagga-wagga", "albury", "mildura", "shepparton",
  "gladstone", "hervey-bay",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://adpilot.app";
  const now = new Date("2026-03-30");

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/marketing`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: new Date("2026-03-29"), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date("2026-03-29"), changeFrequency: "monthly", priority: 0.3 },
  ];

  const cityPages: MetadataRoute.Sitemap = CITY_SLUGS.map((slug) => ({
    url: `${baseUrl}/marketing/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...cityPages];
}
