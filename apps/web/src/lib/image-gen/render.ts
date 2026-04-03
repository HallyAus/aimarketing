import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getInterFonts } from "./font";
import type { CardSpec, TemplateName, TemplateProps } from "./types";
import React from "react";

/* ── Template registry (lazy imports) ─────────────────────────── */

const TEMPLATE_LOADERS: Record<
  TemplateName,
  () => Promise<{ default: (props: TemplateProps) => React.ReactElement }>
> = {
  "product-showcase": () => import("./template-product-showcase"),
  announcement: () => import("./template-announcement"),
  "sale-promo": () => import("./template-sale-promo"),
  testimonial: () => import("./template-testimonial"),
  stats: () => import("./template-stats"),
  "tips-howto": () => import("./template-tips-howto"),
  "before-after": () => import("./template-before-after"),
  "event-launch": () => import("./template-event-launch"),
  "brand-story": () => import("./template-brand-story"),
  "carousel-card": () => import("./template-carousel-card"),
};

/* ── Platform size presets ────────────────────────────────────── */

export const SIZE_PRESETS: Record<string, { width: number; height: number }> = {
  "instagram-square": { width: 1080, height: 1080 },
  "instagram-story": { width: 1080, height: 1920 },
  "facebook-post": { width: 1200, height: 630 },
  "twitter-post": { width: 1600, height: 900 },
  "linkedin-post": { width: 1200, height: 627 },
  "tiktok-cover": { width: 1080, height: 1920 },
  "youtube-thumbnail": { width: 1280, height: 720 },
};

/* ── Render a single card spec to PNG ─────────────────────────── */

export async function renderCardToPng(
  spec: CardSpec,
  width: number,
  height: number,
): Promise<Buffer> {
  const loader = TEMPLATE_LOADERS[spec.template];
  if (!loader) {
    throw new Error(`Unknown template: ${spec.template}`);
  }

  const { default: Template } = await loader();
  const element = React.createElement(Template, { spec, width, height });

  const fonts = await getInterFonts();

  const svg = await satori(element, {
    width,
    height,
    fonts: fonts as any,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}
