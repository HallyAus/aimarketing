import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://adpilot.app";
  return [
    { url: baseUrl, lastModified: new Date("2026-03-30"), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/privacy`, lastModified: new Date("2026-03-29"), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date("2026-03-29"), changeFrequency: "monthly", priority: 0.3 },
  ];
}
