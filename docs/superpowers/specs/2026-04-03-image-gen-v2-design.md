# AI Marketing Image Generator v2

**Date:** 2026-04-03
**Status:** Approved

## Problem

The current image generator produces basic gradient+text SVG cards using Sharp. Users need marketing-quality images — the kind previously created by having Claude generate HTML/CSS cards rendered to PNG. The current URL extraction populates text fields but doesn't drive creative direction.

## Solution

Replace the image generator with a Claude-powered creative pipeline: paste a URL (or write a prompt), Claude analyzes the content and generates 3-5 diverse marketing card specifications, Satori renders them as React templates to PNG.

## Architecture

```
User pastes URL or writes prompt
       |
POST /api/ai/image-gen
       |
  1. If URL: fetch + extract page content (title, description, selling points)
  2. Send content + platform + dimensions to Claude
  3. Claude returns JSON array of 3-5 CardSpec objects
  4. For each spec: select React template, render via Satori -> resvg -> PNG
  5. Return base64 images + specs (for edit/regenerate)
       |
Frontend: image grid with download, edit, schedule
```

## CardSpec Schema

```typescript
interface CardSpec {
  template:
    | "product-showcase" | "announcement" | "sale-promo"
    | "testimonial" | "stats" | "tips-howto"
    | "before-after" | "event-launch" | "brand-story"
    | "carousel-card";

  // Content (Claude fills what's relevant per template)
  headline: string;           // max ~60 chars
  subtext?: string;           // max ~120 chars
  cta?: string;               // "Shop Now", "Learn More", etc.
  metric?: string;            // "10,000+", "50% OFF"
  metricLabel?: string;       // "customers served"
  steps?: string[];           // tips-howto: 3-5 items
  quote?: string;             // testimonial
  attribution?: string;       // testimonial
  beforeText?: string;        // before-after
  afterText?: string;         // before-after
  eventDate?: string;         // event-launch

  // Visual direction
  palette: [string, string];  // gradient start/end
  accentColor: string;        // CTAs, highlights
  mood: "bold" | "elegant" | "playful" | "minimal" | "warm";

  // Brand
  brandName?: string;
  brandTagline?: string;
}
```

Claude is prompted to return diverse specs — varying templates, palettes, and moods across the batch.

## Templates (10 total)

Each template is a React component accepting `CardSpec` + `width` + `height`, returning JSX compatible with Satori's CSS subset (flexbox only, inline styles, no grid, no className).

| Template | Layout | Key Visual Elements |
|----------|--------|-------------------|
| product-showcase | Gradient shape top, text below | Decorative product silhouette area, feature text, CTA button |
| announcement | Centered stack | Large headline, subtext, CTA pill, brand footer |
| sale-promo | Metric dominant | Massive discount number, urgency subtext, CTA |
| testimonial | Quote-centric | Large quote marks, italic text, attribution bottom-right |
| stats | Number hero | Big centered metric, label below, decorative dots |
| tips-howto | Left-aligned list | Numbered circles, 3-5 items, clean typography |
| before-after | Vertical split | Two halves with contrasting gradients, vs divider |
| event-launch | Date badge + info | Date in box/badge, event name large, CTA |
| brand-story | Editorial | Longer text block, warm gradient, generous spacing |
| carousel-card | Slide format | Number badge top-left, content area, swipe dots |

Each template renders subtle decorative SVG elements (circles, lines, geometric shapes) based on the `mood` field.

## API

**Endpoint:** `POST /api/ai/image-gen` (replaces existing)

**Request:**
```typescript
{
  url?: string;              // extract content from URL
  prompt?: string;           // or manual text (one required)
  platform: string;          // determines dimensions
  count: number;             // 3-5
  brandName?: string;
  brandVoiceId?: string;     // pull saved brand voice
  regenerateSpec?: CardSpec; // re-render single card with edits
}
```

**Response:**
```typescript
{
  images: Array<{
    id: string;
    base64: string;          // data:image/png;base64,...
    spec: CardSpec;
    width: number;
    height: number;
  }>;
  extractedContent?: string; // raw URL content for manual editing
}
```

**Platform dimensions:** Same as current SIZE_PRESETS (instagram-square 1080x1080, facebook-post 1200x630, etc.)

## Frontend UX

The page simplifies to three steps:

**Step 1 — Input:**
- URL input with Extract button, OR free-text prompt
- Platform dropdown, count dropdown (3/5), brand name field
- Single "Generate Marketing Images" button
- No style/color/position pickers — Claude decides creative direction

**Step 2 — Results:**
- Responsive image grid
- Each card: image preview, template type badge, headline preview
- Select checkbox per card, select-all toggle
- "Edit & Regenerate" per card — shows CardSpec fields for tweaking, re-renders that one card only
- Download individual or download all

**Step 3 — Schedule:**
- Caption textarea, platform selector, schedule button
- Same auto-schedule flow as current implementation

## Dependencies

- `satori` — React JSX to SVG
- `@resvg/resvg-js` — SVG to PNG (serverless-compatible, no Chromium)
- Inter font bundled as ArrayBuffer (~200KB, cached in memory on cold start)

## Cost

- One Claude API call per generation (creative brief)
- CPU-only for Satori rendering (<1s per image)
- No external image API costs

## Migration

- Replaces existing `/api/ai/image-gen` route and `image-gen/page.tsx`
- Old Sharp-based generation removed entirely
- No database changes needed
- CardSpec is ephemeral (returned in response, not persisted)
