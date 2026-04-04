import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ReachPilot",
    short_name: "ReachPilot",
    description: "AI-powered marketing automation across every social platform",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#3b82f6",
    categories: ["business", "marketing", "productivity"],
    icons: [
      { src: "/icon-1024.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-1024.png", sizes: "384x384", type: "image/png" },
      { src: "/icon-1024.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-1024.png", sizes: "1024x1024", type: "image/png" },
      { src: "/icon-1024.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
