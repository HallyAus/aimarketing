import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AdPilot",
    short_name: "AdPilot",
    description: "AI-powered marketing automation across every social platform",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#3b82f6",
    icons: [
      { src: "/icon-1024.png", sizes: "1024x1024", type: "image/png" },
    ],
  };
}
