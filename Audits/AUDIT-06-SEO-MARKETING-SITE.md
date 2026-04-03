# AdPilot — Audit 6: SEO & Marketing Site

> **For use in Claude Code against the `HallyAus/aimarketing` repo**
> Run autonomously. Fix issues, commit, move on.

---

## CONTEXT

The marketing site drives signups. If it's slow, poorly indexed, or missing structured data, you're leaving users on the table. This audit covers Core Web Vitals, structured data, Open Graph, mobile performance, and content SEO.

**Output:** `docs/seo/SEO-AUDIT.md`

---

## PHASE 1: TECHNICAL SEO

### 1.1 — Metadata
For EVERY page in the marketing site (homepage, about, blog, contact, pricing, docs, terms, privacy, security, status, changelog, careers):
- [ ] Unique `<title>` tag — under 60 chars, keyword-relevant, brand at the end ("Feature Name | AdPilot")
- [ ] Unique `<meta name="description">` — under 160 chars, compelling, includes target keyword
- [ ] Canonical URL: `<link rel="canonical" href="...">`
- [ ] Open Graph: `og:title`, `og:description`, `og:image` (1200x630px), `og:url`, `og:type`, `og:site_name`
- [ ] Twitter Cards: `twitter:card` (summary_large_image), `twitter:title`, `twitter:description`, `twitter:image`

### 1.2 — Sitemap & Robots
- Create `src/app/sitemap.ts` (Next.js App Router format) listing every public page + blog posts
- Create `src/app/robots.ts` — allow all public pages, disallow `/api/`, `/admin/`, `/dashboard/`
- Verify sitemap URL is correct and accessible
- Blog posts dynamically included in sitemap with `lastModified` dates

### 1.3 — Structured Data (JSON-LD)
Add to the homepage:
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AdPilot",
  "description": "AI-powered marketing automation platform",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": [
    { "@type": "Offer", "price": "0", "priceCurrency": "USD", "name": "Free" },
    { "@type": "Offer", "price": "49", "priceCurrency": "USD", "name": "Pro" },
    { "@type": "Offer", "price": "299", "priceCurrency": "USD", "name": "Agency" }
  ]
}
```
Add `FAQPage` schema to the FAQ section.
Add `Organization` schema to the footer/layout.
Add `Article` schema to each blog post.

### 1.4 — Internal Linking
- Every page reachable within 3 clicks from the homepage
- Blog posts link to relevant feature pages and pricing
- Feature pages link to pricing CTA
- No orphaned pages (pages with no internal links pointing to them)
- Breadcrumbs on subpages with `BreadcrumbList` schema

---

## PHASE 2: PERFORMANCE (CORE WEB VITALS)

### 2.1 — LCP (Largest Contentful Paint) — Target: < 2.5s
- Hero section image/text must be server-rendered (not client-rendered after JS loads)
- Above-the-fold images: use `<Image priority>` from `next/image`
- Fonts: loaded via `next/font` with `display: swap` (no FOIT)
- No render-blocking CSS or JS in the `<head>`

### 2.2 — INP (Interaction to Next Paint) — Target: < 200ms
- No heavy JavaScript executing on click handlers
- Event handlers are lightweight (no synchronous API calls on button click — use loading states)
- FAQ accordion: CSS-only or minimal JS

### 2.3 — CLS (Cumulative Layout Shift) — Target: < 0.1
- All images have explicit `width` and `height` attributes
- Fonts: size-adjusted fallback to prevent layout shift on load
- Dynamic content (testimonials, stats counters) has reserved space
- No content injected above the fold after initial paint

### 2.4 — Image Optimization
- All images use `next/image` component (not raw `<img>`)
- Images served in WebP/AVIF format (Next.js does this automatically)
- Responsive `sizes` attribute set correctly (not serving 2000px images on mobile)
- OG image: pre-generated, not dynamically rendered on every request
- Lazy loading on all below-fold images (`loading="lazy"` — Next.js default for non-priority images)

### 2.5 — Font Loading
```typescript
// src/app/layout.tsx
import { Inter, Space_Grotesk } from 'next/font/google'; // or whatever fonts are used

const heading = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--font-heading' });
const body = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-body' });
```
- No external font CDN links (`<link href="https://fonts.googleapis.com/...">`)
- Font files self-hosted via `next/font`
- Font fallback with `size-adjust` to prevent CLS

---

## PHASE 3: MOBILE PERFORMANCE

- Test every page at 375px width — no horizontal scroll, no overlapping content
- Touch targets: all buttons/links minimum 44x44px
- Mobile nav: hamburger menu works, all links accessible
- Hero section: text readable without zooming on mobile
- Pricing cards: stack vertically on mobile, not overflow horizontally
- Forms: inputs fill the screen width, keyboard doesn't obscure fields

---

## PHASE 4: BLOG SEO

### 4.1 — Blog Post Template
Each blog post needs:
- H1 title (only one per page)
- Published date and last modified date
- Author name with optional avatar
- Estimated reading time
- Table of contents for posts >1000 words
- Internal links to relevant AdPilot features
- CTA at the end ("Ready to automate your marketing? Start free →")
- Social sharing buttons (or at least OG tags for good previews when shared)

### 4.2 — Blog Index
- Paginated (10 posts per page)
- Category/tag filtering
- Search functionality
- RSS feed (`/blog/feed.xml`)

---

## PHASE 5: CONVERSION OPTIMIZATION

- Primary CTA ("Start Free") visible above the fold on every page
- Secondary CTA in the sticky header (appears on scroll)
- Pricing page: comparison table format, most popular plan highlighted
- Social proof near CTAs (user count, testimonials, or trust badges)
- Exit intent popup (email capture, once per session, dismissible)

---

## EXECUTION RULES

1. Fix every issue. Commit with `seo:` or `perf:` prefix.
2. Structured data first, then performance, then content.
3. Run `npm run build` after every phase.

---

☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)
🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.

*Generated for Daniel Hall — AdPilot / Agentic Consciousness — April 2026*
