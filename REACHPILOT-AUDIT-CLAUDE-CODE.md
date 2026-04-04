# ReachPilot Website — Full Audit, Fix & Improvement Prompt

> **For use in Claude Code against the `HallyAus/aimarketing` repo**
> Run this prompt autonomously. Do not ask questions — make decisions, implement, commit, and move on.

---

## CONTEXT

You are auditing and improving the **ReachPilot** website — an AI marketing agency (NOT a SaaS platform) built with Next.js App Router, Prisma, Redis, BullMQ, and deployed on Vercel.

- **Repo:** `HallyAus/aimarketing`
- **Live URL:** https://aimarketing-danieljhall-mecoms-projects.vercel.app/
- **Brand:** ReachPilot — AI-powered full-service marketing agency
- **Design palette:** Violet/mint dual-accent
- **Pricing model:** Retainer-based agency pricing ($4,900 / $9,800 / Custom per month) — NOT SaaS subscription pricing
- **Target audience:** Australian SMBs and mid-market businesses who want AI-powered marketing done for them
- **Owner:** Daniel Hall (daniel@agenticconsciousness.com.au)
- **Parent brand:** Agentic Consciousness (agenticconsciousness.com.au)

---

## PHASE 0: RECONNAISSANCE

Before changing anything, understand the codebase:

1. Read `package.json`, `next.config.*`, `tsconfig.json`, `tailwind.config.*`, `.env.example` (or `.env.local` if present)
2. Run `tree src/ -I node_modules --dirsfirst` to map the full project structure
3. Read every page file (`page.tsx`) and layout file (`layout.tsx`)
4. Read every API route under `src/app/api/`
5. Read all component files
6. Read Prisma schema if present (`prisma/schema.prisma`)
7. Read Docker Compose file if present
8. Read any middleware (`middleware.ts`)
9. Check for existing tests
10. Run `npm install` then `npm run build` — capture ALL errors and warnings

Document every finding before proceeding. Create a file `AUDIT-REPORT.md` in the repo root with your findings.

---

## PHASE 1: CRITICAL FIXES

Fix these in order. Each fix gets its own commit with a descriptive message.

### 1.1 — Broken Subpages (404s)

The footer links to these pages that all return 404:
- `/about`
- `/blog`
- `/careers`
- `/contact`
- `/docs`
- `/api` (documentation page, not the API routes)
- `/status`
- `/changelog`
- `/privacy`
- `/terms`
- `/security`

**Action:** Create all missing pages. Each page must:
- Use the existing layout/nav/footer components
- Have real, professional content (not lorem ipsum)
- Follow the existing design system (violet/mint palette, consistent typography)
- Be SEO-ready with proper metadata (`generateMetadata`)

**Content guidelines per page:**
- **About:** ReachPilot story, mission (AI-powered marketing done right), team section (Daniel Hall as founder + "Our AI Team" section), Australian-built positioning
- **Contact:** Contact form (name, email, company, message, budget range dropdown), direct email (hello@reachpilot.com.au as placeholder), phone, office hours (AEST), embedded map or location reference (Central Coast, NSW)
- **Blog:** Blog index page with placeholder for 3-5 seed articles about AI marketing. Create the dynamic route `blog/[slug]/page.tsx` too. Articles should be stored as MDX or in a `/content` directory
- **Careers:** "We're not hiring right now but always looking for talented people" page with a general application form or email CTA
- **Docs:** API/integration documentation landing page — even if minimal, it should explain what ReachPilot offers for integrations
- **Privacy:** Full Australian Privacy Act compliant privacy policy for a marketing agency handling client data and social media accounts
- **Terms:** Terms of service covering agency-client relationship, IP ownership of created content, payment terms, liability
- **Security:** Security practices page — data encryption, OAuth handling, SOC 2 aspirations, responsible disclosure policy
- **Status:** Simple status page showing service operational status (can be static "All systems operational" for now)
- **Changelog:** Product/service updates page with 3-5 seed entries

### 1.2 — Positioning Mismatch: SaaS vs Agency

The live site currently presents ReachPilot as a **SaaS platform** with self-serve pricing ($0/$49/$299). This is WRONG. ReachPilot is a **full-service AI marketing agency**.

**Action — Rewrite the following:**

**Hero section:**
- Remove "Your AI Marketing Team, Always On" SaaS language
- Replace with agency positioning: "AI-Powered Marketing. Done For You." or similar
- Subtitle should emphasise the agency relationship — strategy, execution, reporting, all handled by AI-augmented humans
- Remove "Start Free" CTAs — replace with "Book a Strategy Call" / "Get a Proposal"

**Pricing section — COMPLETE REWRITE:**
- Remove the Free / Pro / Agency SaaS tiers entirely
- Replace with retainer-based agency pricing:
  - **Growth** — $4,900/mo: 2 platforms, 20 posts/week, monthly reporting, AI content creation, basic strategy
  - **Scale** — $9,800/mo: All platforms, unlimited posts, weekly reporting, full strategy, ad management, A/B testing, dedicated strategist
  - **Enterprise** — Custom: White-label, multi-brand, custom integrations, SLA, dedicated team
- CTA buttons: "Book a Call" (Growth/Scale) and "Contact Us" (Enterprise)
- Remove "Start Free", "Start Pro Trial" — agencies don't offer free trials
- Add "Minimum 3-month engagement" note

**Features section:**
- Reframe from "platform features" to "what we do for you"
- Keep the 9-platform coverage but frame it as "We manage your presence across 9 platforms" not "publish from one place"
- Add: Strategy & Planning, Content Calendar, Community Management, Paid Ads Management, Monthly/Weekly Reporting

**Social proof / stats bar:**
- "Trusted by 500+ Australian businesses" — keep if true, otherwise remove or soften to "Trusted by Australian businesses"
- The animated counters (0 → values) — ensure they actually animate. If broken, fix the Intersection Observer / animation logic

**Testimonials:**
- The current testimonials reference "Sarah Mitchell", "James Chen", "Emily Oakes" — these look fabricated
- Either clearly mark as illustrative OR remove and replace with a "Case Studies Coming Soon" CTA
- Better: create a case studies section with anonymised but realistic results ("E-commerce client — 340% increase in social engagement in 90 days")

### 1.3 — Dead Links & Navigation

- All `#pricing`, `#features`, `#platforms`, `#faq` anchor links — verify smooth scroll works
- "Watch Demo" link goes to `#demo` which doesn't exist — either create a demo section or remove the link
- Footer links must all resolve to real pages (see 1.1)
- Mobile nav — verify hamburger menu works, all links functional
- Add proper `<Link>` components (Next.js) for all internal navigation, not `<a>` tags

### 1.4 — Build Errors & TypeScript

- Run `npm run build` and fix EVERY error and warning
- Run `npx tsc --noEmit` and fix ALL TypeScript errors
- Fix any ESLint warnings/errors (`npx eslint . --fix`)
- Ensure zero build warnings in the Vercel build log

---

## PHASE 2: PERFORMANCE & SEO

### 2.1 — Core Web Vitals

- Run Lighthouse audit mentally against the code:
  - All images must use `<Image>` from `next/image` with proper `width`, `height`, `alt`, and `priority` for above-the-fold
  - Add `loading="lazy"` for below-fold images
  - Ensure fonts are loaded with `next/font` (not external CDN links)
  - Add `preconnect` for any external origins
  - Check for layout shift — all elements with dynamic content need explicit dimensions

### 2.2 — SEO & Metadata

- Every page needs `generateMetadata` or `export const metadata` with:
  - Unique `title` and `description`
  - Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`)
  - Twitter Card tags
  - Canonical URL
- Create `/sitemap.ts` (Next.js App Router sitemap) listing all pages
- Create `/robots.ts` with proper allow/disallow rules
- Add structured data (JSON-LD) to the homepage:
  - `Organization` schema
  - `Service` schema for marketing services
  - `FAQPage` schema for the FAQ section
- Add `manifest.json` / `site.webmanifest` for PWA basics

### 2.3 — Accessibility

- Run through all interactive elements:
  - Every button/link needs descriptive text or `aria-label`
  - Form inputs need associated `<label>` elements
  - Colour contrast must meet WCAG 2.1 AA (4.5:1 for text, 3:1 for large text)
  - Focus states on all interactive elements
  - Skip-to-content link
  - Proper heading hierarchy (one `h1` per page, sequential `h2`→`h3`)
  - `prefers-reduced-motion` media query to disable animations
  - `prefers-color-scheme` support if applicable

---

## PHASE 3: DESIGN & UX IMPROVEMENTS

### 3.1 — Visual Polish

The site uses a violet/mint dual-accent palette. Review and improve:

- **Typography:** Ensure the font stack is distinctive — avoid Inter/Roboto/system defaults. Use a strong display font for headings and a clean sans-serif for body. Load via `next/font/google` or `next/font/local`
- **Spacing:** Audit vertical rhythm — sections should breathe. Ensure consistent padding/margin scale
- **Animations:** Add tasteful entrance animations (fade-up on scroll) using CSS `@keyframes` + Intersection Observer or Framer Motion. Respect `prefers-reduced-motion`
- **Hover states:** All cards, buttons, and links need polished hover/focus transitions
- **Dark mode:** If not implemented, add it with CSS variables and a toggle. The violet/mint palette works beautifully in both modes
- **Mobile responsiveness:** Test at 375px, 768px, 1024px, 1440px breakpoints. Fix any overflow, cramped text, or broken layouts

### 3.2 — Platform Icons

The current platform icons (f, ig, tt, in, yt, x, g, p, sc) render as plain text letters. Replace with:
- Proper SVG icons for each platform (Facebook, Instagram, TikTok, LinkedIn, Twitter/X, YouTube, Google Ads, Pinterest, Snapchat)
- Use a consistent icon set or create custom SVG components
- Ensure icons are accessible with `aria-label` attributes

### 3.3 — Call-to-Action Flow

- Primary CTA throughout should be "Book a Strategy Call" linking to `/contact` or a Calendly embed
- Secondary CTA: "See Our Work" linking to `/about#case-studies` or a dedicated case studies page
- Remove all "Start Free" / "Sign Up" SaaS-style CTAs
- Add a floating/sticky CTA on mobile (bottom bar: "Book a Call")
- Exit-intent or scroll-depth CTA popup (tasteful, dismissible, shows once per session)

### 3.4 — Trust Signals

Add throughout the site:
- "Australian Owned & Operated" badge
- "Powered by Claude AI" or "Built with Anthropic" reference (with permission context)
- Client logo bar (use placeholder greyscale logos with "Your Logo Here" text if no real clients yet)
- Results metrics in a prominent position ("Average 3.2x ROAS for clients", "12,000+ posts published" — use realistic but aspirational numbers, clearly marked)

---

## PHASE 4: BACKEND & INFRASTRUCTURE

### 4.1 — API Routes Audit

Review every file under `src/app/api/`:
- Check for proper error handling (try/catch, appropriate HTTP status codes)
- Validate all inputs (use Zod schemas)
- Check for rate limiting on public endpoints
- Ensure no secrets or API keys are hardcoded
- Verify CORS configuration
- Add request logging (structured JSON logs)

### 4.2 — Database & Prisma

If Prisma is present:
- Review the schema for proper relations, indexes, and constraints
- Run `npx prisma validate`
- Check for N+1 query patterns in any data-fetching code
- Ensure migrations are clean and committed
- Add seed data script if not present

### 4.3 — Redis & BullMQ

If Redis/BullMQ is configured:
- Verify connection handling (graceful reconnection, error handling)
- Check queue job definitions for proper retry logic and dead letter handling
- Ensure workers clean up properly
- Add health check endpoint for Redis connectivity

### 4.4 — Environment Variables

- Create/update `.env.example` with ALL required env vars (no values, just keys with comments)
- Verify all env vars are accessed via a validated config module (not raw `process.env` scattered everywhere)
- Use Zod or similar for env validation at startup

### 4.5 — Security Headers

Add to `next.config.js` (or verify existing):
```javascript
headers: [
  {
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    ],
  },
]
```

### 4.6 — Error Handling

- Add global error boundary (`error.tsx` in app root and key route segments)
- Add `not-found.tsx` with a branded 404 page
- Add `loading.tsx` skeletons for pages with data fetching
- Ensure API routes return consistent error response shape: `{ error: string, code: string }`

---

## PHASE 5: CONTENT & COPY

### 5.1 — Copy Audit

Review ALL copy on the site for:
- Consistency — "ReachPilot" capitalisation, no "Adpilot" or "reachpilot"
- Tone — professional but approachable, Australian English (colour, organisation, optimise)
- Claims — remove or soften any unverifiable claims ("500+ businesses" if not true)
- Agency language — every reference should frame ReachPilot as a team doing work FOR the client, not a tool the client uses themselves
- Grammar and spelling — fix everything

### 5.2 — FAQ Section

Review and update the FAQ to match agency positioning:
- Remove SaaS-oriented questions ("Can I try for free?", "How does team collaboration work?")
- Add agency-relevant FAQs:
  - "What's included in a retainer?"
  - "How long until I see results?"
  - "Do you work with businesses in my industry?"
  - "Who owns the content you create?"
  - "Can I see examples of your work?"
  - "What happens if I want to cancel?"
  - "How do you handle our brand voice?"
  - "What reporting do I get?"

### 5.3 — Blog Seed Content

Create 3-5 seed blog posts (MDX or Markdown) in a `/content/blog/` directory:
1. "Why AI Marketing Agencies Will Replace Traditional Agencies by 2027"
2. "The True Cost of DIY Social Media for Australian Businesses"
3. "How We Use Claude AI to Create 10x More Content Without Losing Your Brand Voice"
4. "Facebook vs Instagram vs TikTok: Where Should Australian Businesses Focus in 2026?"
5. "Case Study: How We Grew a Central Coast Business's Social Engagement by 340%"

Each post: 800-1200 words, real insights, proper frontmatter (title, date, author, excerpt, tags, coverImage placeholder).

---

## PHASE 6: DEVELOPER EXPERIENCE

### 6.1 — README

Rewrite `README.md` to include:
- Project overview (what ReachPilot is)
- Tech stack
- Local development setup instructions
- Environment variables documentation
- Deployment instructions (Vercel)
- Project structure guide
- Contributing guidelines

**Add to bottom of README:**
```markdown
---

☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)

🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.
```

### 6.2 — Code Quality

- Add Prettier config (`.prettierrc`) if not present
- Add/update ESLint config for Next.js best practices
- Add `lint-staged` + `husky` for pre-commit hooks (lint + format)
- Add path aliases in `tsconfig.json` (`@/components`, `@/lib`, `@/utils`, etc.)
- Ensure consistent file naming convention (kebab-case for files, PascalCase for components)

### 6.3 — Testing

- Add Vitest or Jest config
- Write tests for:
  - All API routes (happy path + error cases)
  - Utility functions
  - Key component renders (smoke tests)
- Add `npm run test` script

---

## PHASE 7: PRE-DEPLOYMENT CHECKLIST

Before committing the final changes, verify:

- [ ] `npm run build` passes with zero errors and zero warnings
- [ ] `npx tsc --noEmit` passes clean
- [ ] `npx eslint .` passes clean
- [ ] All pages render without console errors
- [ ] All links resolve (no 404s)
- [ ] All images have alt text
- [ ] Mobile responsive at 375px / 768px / 1024px / 1440px
- [ ] Metadata present on every page
- [ ] Sitemap generated correctly
- [ ] robots.txt present
- [ ] Favicon and OG image present
- [ ] Environment variables documented
- [ ] README is up to date
- [ ] No hardcoded secrets in the codebase
- [ ] `.gitignore` covers all generated files, `.env*`, `node_modules`, `.next`

---

## EXECUTION RULES

1. **Work autonomously.** Do not ask questions. Make reasonable decisions and document them in commit messages.
2. **Commit after each logical unit of work.** Use conventional commit messages: `fix:`, `feat:`, `refactor:`, `docs:`, `style:`, `chore:`.
3. **If something is unclear, make the best decision and note it** in `AUDIT-REPORT.md` under a "Decisions Made" section.
4. **Prioritise:** Critical fixes (Phase 1) → Performance/SEO (Phase 2) → Design (Phase 3) → Backend (Phase 4) → Content (Phase 5) → DX (Phase 6) → Checklist (Phase 7).
5. **If you hit a blocker** (missing dependency, missing env var, broken upstream), skip it, note it in the audit report, and continue with the next item.
6. **Test after every phase.** Run `npm run build` to catch regressions.
7. **Do not introduce new dependencies** unless absolutely necessary. Prefer built-in Next.js features and Tailwind utilities.
8. **Australian English everywhere** — colour, organisation, optimise, analyse, behaviour.

---

*Generated for Daniel Hall — ReachPilot / Agentic Consciousness — April 2026*
