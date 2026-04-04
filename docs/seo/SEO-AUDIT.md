# ReachPilot SEO & Marketing Site Audit

> Generated 2026-04-03 as part of Audit 06.

---

## 1. Metadata Audit

### Root Layout (`apps/web/src/app/layout.tsx`)

- [x] Default title: `"ReachPilot | AI-Powered Marketing Automation"` (47 chars -- good)
- [x] Title template: `"%s | ReachPilot"` -- all child pages get the brand suffix
- [x] Default description: present, 131 chars (under 160)
- [x] `metadataBase` configured with `NEXT_PUBLIC_APP_URL`
- [x] Canonical URL: `alternates.canonical: "./"` -- auto-canonical on every page
- [x] Open Graph: `og:title`, `og:description`, `og:siteName`, `og:type`, `og:images`
- [x] Twitter Card: `summary_large_image`, title, description
- [x] Viewport configured separately via `export const viewport`
- [x] Theme color set (`#3b82f6`)

### Per-Page Metadata

Every marketing page exports a unique `metadata` object:

| Page | Title | Description | OG | Status |
|---|---|---|---|---|
| Homepage (`/`) | Default from layout | Default from layout | From layout | OK |
| About (`/about`) | "About ReachPilot \| AI-Powered..." | 131 chars | Yes | OK |
| Blog (`/blog`) | "Blog \| ReachPilot" | 123 chars | Yes | OK |
| Blog posts (`/blog/[slug]`) | Dynamic `generateMetadata` | Dynamic | Yes | OK |
| Contact (`/contact`) | "Contact Us \| ReachPilot" | 88 chars | Yes | OK |
| Careers (`/careers`) | "Careers \| ReachPilot" | 86 chars | Yes | OK |
| Changelog (`/changelog`) | "Changelog \| ReachPilot" | 66 chars | Yes | OK |
| Docs (`/docs`) | "Documentation \| ReachPilot" | 118 chars | Yes | OK |
| Marketing (`/marketing`) | Unique | Unique | Yes | OK |
| Marketing/[city] | Dynamic `generateMetadata` | Dynamic per city | Yes | OK |
| Privacy (`/privacy`) | "Privacy Policy \| ReachPilot" | 108 chars | Yes | OK |
| Security (`/security`) | "Security \| ReachPilot" | 107 chars | Yes | OK |
| Signup (`/signup`) | "Join the Waitlist \| ReachPilot" | 96 chars | Yes | OK |
| Status (`/status`) | "System Status \| ReachPilot" | 81 chars | Yes | OK |
| Terms (`/terms`) | "Terms of Service \| ReachPilot" | 111 chars | Yes | OK |

### Findings

- All 15+ marketing pages have unique titles and descriptions.
- All are under 60 chars (title) and 160 chars (description).
- OG tags present on every page (title, description, type, url).
- **Minor issue:** Some OG URLs use `reachpilot.au` while `metadataBase` is `reachpilot.app`. These should be consistent but are not blocking since Next.js resolves relative OG URLs from `metadataBase`.
- **Missing:** `twitter:image` is not set per-page (falls back to layout's `icon-1024.png`). A 1200x630 OG image would be better for social sharing.

---

## 2. Sitemap (`apps/web/src/app/sitemap.ts`)

- [x] Exists and uses Next.js App Router `MetadataRoute.Sitemap` format
- [x] Includes all 13 static marketing pages
- [x] Includes 5 blog post slugs with `lastModified`
- [x] Includes 30 city landing pages (`/marketing/[city]`)
- [x] Correct `changeFrequency` and `priority` values
- [x] Total entries: 48 URLs

### Recommendations

- [ ] Auto-generate blog slugs from database/CMS instead of hardcoded array
- [ ] Add `lastModified` per blog post based on actual publish/update dates

---

## 3. Robots (`apps/web/src/app/robots.ts`)

- [x] Exists and uses Next.js `MetadataRoute.Robots` format
- [x] Allows all public pages: `allow: "/"`
- [x] Disallows: `/api/`, `/dashboard/`, `/settings/`, `/onboarding/`, `/(auth)/`
- [x] Sitemap URL included: `${baseUrl}/sitemap.xml`
- [x] No overly restrictive rules

**Status:** Correctly configured. No changes needed.

---

## 4. JSON-LD Structured Data (`apps/web/src/app/page.tsx`)

### SoftwareApplication Schema

- [x] `@type: "SoftwareApplication"`
- [x] `name: "ReachPilot"`
- [x] `description` present (meaningful, includes keywords)
- [x] `applicationCategory: "BusinessApplication"`
- [x] `operatingSystem: "Web"`
- [x] Three `Offer` objects (Free $0, Pro $49, Agency $299)
- [x] Pro/Agency offers include `priceSpecification` with monthly billing
- [x] `creator` Organization with `founder` Person
- [x] `featureList` with 6 features
- [x] `url` set to `https://reachpilot.app`

### FAQPage Schema

- [x] `@type: "FAQPage"` with `mainEntity` array
- [x] Three FAQ questions with `Question`/`Answer` pairs
- [x] Content matches visible FAQ section on page

### Correctness

The JSON-LD is rendered via `<script type="application/ld+json">` in the page component. Both schemas are in a single array, which is valid. Google's Rich Results Test should parse both.

### Missing Structured Data (Future Work)

- [ ] `Organization` schema in footer/layout (site-wide)
- [ ] `Article` schema on blog posts
- [ ] `BreadcrumbList` schema on subpages

---

## 5. Image Alt Text Audit

### Marketing Components (`apps/web/src/components/marketing/`)

No `<img>` or `<Image>` tags found in marketing components. The marketing site uses CSS backgrounds, SVG icons, and text-based content. No alt text issues.

### Dashboard Images

- `(dashboard)/ai/page.tsx`: `alt="Generated image: ${text.substring(0, 80)}"` -- descriptive, good
- `(dashboard)/ai/image-gen/page.tsx`: `alt="AI Generated"` -- could be more descriptive but acceptable for user-generated content
- `(dashboard)/select-page/page.tsx`: `alt=""` -- decorative image, empty alt is correct per WCAG

**Status:** No missing alt text issues found.

---

## 6. Font Loading

- [x] `Inter` loaded via `next/font/google` with `display: "swap"` (no FOIT)
- [x] `JetBrains_Mono` loaded via `next/font/google` with `display: "swap"`
- [x] CSS variables used (`--font-sans`, `--font-mono`)
- [x] No external font CDN links in `<head>`
- [x] Fonts self-hosted via Next.js automatic optimization

---

## 7. Performance Considerations

- [x] Skip-to-content link present in root layout (accessibility)
- [x] `lang="en"` set on `<html>` element
- [x] Vercel Analytics (`@vercel/analytics/next`) lightweight integration
- [x] `preconnect` hint for PostHog
- [ ] No `<Image priority>` detected on hero section (check `hero-section.tsx`)
- [ ] OG image is `icon-1024.png` (square) -- should be 1200x630 for social previews

---

## 8. Summary of Issues

### No Action Required

1. All pages have unique, well-formed metadata
2. Sitemap includes all public pages
3. Robots.txt correctly configured
4. JSON-LD valid for SoftwareApplication and FAQPage
5. No missing alt text on marketing pages
6. Fonts self-hosted with swap display

### Minor Issues (Low Priority)

1. **OG URL inconsistency** -- Some pages hardcode `reachpilot.au` in OG URLs while `metadataBase` is `reachpilot.app`. Not blocking but should be unified.
2. **OG image aspect ratio** -- Current OG image is 1024x1024 (square). Social platforms prefer 1200x630. Create a dedicated OG image.
3. **`alt="AI Generated"`** in image-gen page could include the prompt text for better accessibility.

### Future Work

1. Add `Organization` JSON-LD schema to root layout
2. Add `Article` JSON-LD schema to blog post template
3. Add `BreadcrumbList` JSON-LD to subpages
4. Auto-generate sitemap blog entries from database
5. Create 1200x630 OG image for social sharing
6. Add `<Image priority>` to hero section above-the-fold images
7. Add RSS feed at `/blog/feed.xml`
