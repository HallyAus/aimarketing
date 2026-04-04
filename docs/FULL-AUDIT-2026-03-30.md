# ReachPilot Full Audit Report — 2026-03-30

**Audited by:** 7 parallel agents (Frontend Design, Security, Code Quality, SEO/Performance, Database/API, Platform SDK, Deployment/DevOps)

---

## Executive Summary

ReachPilot has strong architectural foundations — Server Component-first Next.js, proper OAuth with PKCE, AES-256-GCM encryption, org-scoped Prisma queries, and a clean monorepo structure. However, it is **not production-ready**. There are critical security gaps (auth disabled, no rate limiting, unauthenticated Redis), missing infrastructure (no Prisma migrations, no `.dockerignore`, no error tracking), and significant frontend gaps (broken dark theme on 4 pages, no mobile navigation, zero shared components).

### Finding Counts

| Severity | Security | Frontend | Code Quality | Database/API | Platform SDK | SEO/Perf | DevOps | **Total** |
|----------|----------|----------|-------------|-------------|-------------|----------|--------|-----------|
| Critical | 5 | 7 | — | 12 | 3 | 2 | 3 | **32** |
| High | 8 | 16 | 6 | 11 | 5 | 4 | 7 | **57** |
| Medium | 9 | — | 12 | 9 | 5 | 5 | 8 | **48** |
| Low | 6 | 14 | 20 | — | 2 | 4 | 5 | **51** |
| **Total** | **28** | **37** | **38** | **32** | **15** | **15** | **23** | **188** |

---

## P0 — Must Fix Before Going Public

These are production blockers. Deploying without fixing these creates immediate security, data-loss, or usability risks.

### Security (5 critical)
1. **Remove or fix Credentials provider** — accepts any email, auto-creates accounts with no password (`apps/web/src/lib/auth.ts:23-42`)
2. **Re-enable auth in middleware** — currently only sets request ID, no session checks (`apps/web/src/middleware.ts`)
3. **Wire up rate limiters** — defined in `rate-limit.ts` but never imported anywhere
4. **Add Redis authentication** — no `--requirepass` in either compose file; Redis stores job queues and rate limit state
5. **Guard/remove dev-login endpoint** — `NODE_ENV` check alone is insufficient (`apps/web/src/app/api/auth/dev-login/route.ts`)

### Deployment (3 critical)
6. **Create `.dockerignore`** — `.env`, `.env.local`, `.git/`, `node_modules/` are all copied into Docker build context, leaking secrets into image layers
7. **Generate Prisma migration files** — no migration files exist; prod uses `db push --accept-data-loss` which can drop tables
8. **Remove `--accept-data-loss`** from `deploy/2-setup-app.sh` fallback

### Database (3 critical)
9. **Add missing indexes** on 11 foreign key columns (Account.userId, Session.userId, Campaign.createdBy, Post.approvedBy, AuditLog.userId, etc.)
10. **Wrap publish endpoint in `$transaction()`** — race condition: two clicks = double-publish (`campaigns/[campaignId]/publish/route.ts:42-56`)
11. **Fix Redis eviction policy** — `allkeys-lru` silently drops BullMQ jobs when memory full; use `noeviction`

### Platform SDK (2 critical)
12. **Fix timing attack in webhook verifier** — uses `===` instead of `crypto.timingSafeEqual()` (`webhook-verifiers/meta.ts:11`)
13. **Add concurrency lock to token refresh** — race condition: two concurrent requests both try to refresh, second uses invalidated token (`client.ts:30-83`)

### Frontend (2 critical)
14. **Add mobile navigation** — sidebar is `hidden md:flex`, mobile header has no hamburger menu; app is non-navigable on mobile
15. **Fix broken dark theme on 4 pages** — org-picker, invite, privacy, terms all use Tailwind light-mode utilities on dark background

### SEO/Performance (1 critical)
16. **Replace CSS `@import` fonts with `next/font`** — render-blocking chain adds 200-500ms to LCP (`globals.css:5`)

---

## P1 — Fix This Week

### Security
17. Fix IDOR in `/api/organizations/[orgId]` — uses URL param instead of `req.orgId` (H-1)
18. Delete `get-org.ts` — returns first org in DB regardless of caller (H-2)
19. Add Zod validation + rate limits to all 4 AI endpoints (H-6)
20. Apply `sanitizeHtml` to user input before storage — functions exist but are never called (H-7)
21. Wrap billing checkout in `withErrorHandler` (H-8)
22. Fix CSV injection in analytics export — campaign name not escaped (H-5)

### Frontend
23. Build shared component library — zero reusable components; Badge, MetricCard, FormField, PageHeader all duplicated across pages
24. Add form submission error handling — silent failures on campaigns/new, templates/new, posts/new
25. Add loading/pending states for all form submissions (useFormStatus/useActionState)
26. Add active-state indicator to sidebar navigation
27. Fix onboarding links pointing to wrong routes (`/dashboard/settings/...` should be `/settings/...`)
28. Associate form labels with inputs via `htmlFor`/`id` (accessibility)
29. Add `focus-visible` styles to all buttons (keyboard accessibility)

### Database/API
30. Add pagination to all list endpoints (campaigns, posts, members, invitations, templates)
31. Standardize AI routes — wrap with `withErrorHandler(withRole())`, add plan gating
32. Add retry configuration to BullMQ queues — most have zero retries
33. Set up dead letter queue for failed jobs
34. Re-enable token expiry email notification (currently commented out in worker)
35. Add job deduplication to publish flow — prevent double-publish on button double-click

### Platform SDK
36. Implement rate limit handling — zero awareness of platform rate limits; need 429/Retry-After parsing
37. Normalize platform errors — create `PlatformError` class instead of raw string throws
38. Add `@types/node` to devDependencies — build is broken without it
39. Add webhook verifiers for TikTok and Snapchat (both use HMAC-SHA256)
40. Implement proactive token refresh — `shouldProactivelyRefresh()` exists but is never called

### DevOps
41. Make `deploy.yml` depend on CI passing (`needs: ci`)
42. Add migration step to deploy.yml SSH script
43. Add rollback mechanism to auto-deploy
44. Fix backup retention logic — currently just keeps newest 14 files, not daily/weekly/monthly
45. Fix backup R2 credential variable name mismatch
46. Add error tracking (Sentry or Axiom) to web and worker
47. Add worker health check in docker-compose.prod.yml

---

## P2 — Next Sprint

### Security
48. Add startup validation for required env vars (Zod schema)
49. Add runtime check that MASTER_ENCRYPTION_KEY is not all-zeros in production
50. Tighten CSP — remove `unsafe-inline` and `unsafe-eval`, use nonces
51. Bind dev compose ports to localhost only (`127.0.0.1:5432:5432`)
52. Clamp analytics `days` parameter to max 365

### Frontend
53. Fix `--border-subtle` CSS variable (doesn't exist — should be `--border-secondary`)
54. Replace `<a>` tags with `<Link>` for internal navigation on dashboard
55. Fix `prose` dark mode on privacy/terms pages (need `prose-invert`)
56. Add skip-to-content link for keyboard navigation
57. Add `aria-live` regions for AI Studio loading/results
58. Fix `--text-tertiary` contrast ratio (4.1:1 fails WCAG AA for small text)
59. Lazy-load AI Studio tabs with `React.lazy()`/`dynamic()`
60. Add page-specific loading skeletons for heavy pages

### Code Quality
61. Extract R2 client to `packages/shared` — duplicated between web and worker
62. Deduplicate Stripe plan price IDs (defined in both `stripe.ts` and `constants.ts`)
63. Unify Platform enum — Prisma enum vs platform-sdk string union can drift
64. Add env validation module in `packages/shared/src/env.ts`
65. Add lint and typecheck to CI pipeline
66. Add tests for plan limit enforcement, post status transitions, sanitization

### Database
67. Add composite index `[postId, snapshotAt]` on AnalyticsSnapshot
68. Change `WebhookEvent.platform` from String to Platform enum
69. Add `updatedAt` to User, Membership, Invitation models
70. Fix `Creative.fileSizeBytes` — Int overflows for video >2GB, use BigInt

### SEO
71. Add canonical URL to root metadata
72. Create proper 1200x630 OG image (currently using 1024x1024 square icon)
73. Add JSON-LD structured data to home page (WebApplication, Organization)
74. Generate multiple favicon sizes (16, 32, 180, 192, 512)
75. Fix sitemap `lastModified` — currently returns `new Date()` on every request

### DevOps
76. Add Redis `--appendonly yes` for BullMQ persistence
77. Compile worker to JS instead of running `npx tsx` in production
78. Add Docker build caching to deploy.yml (`cache-from`/`cache-to` with `type=gha`)
79. Fix branch mismatch — deploy scripts use `master`, CI uses `main`
80. Add alerting/uptime monitoring

---

## P3 — Backlog

- Remove empty `packages/ui` from web dependencies until used
- Add breadcrumbs to nested pages
- Custom-style native checkboxes and color inputs for dark theme
- Add `aria-hidden="true"` to decorative SVG nav icons
- Add `aria-label` to color swatch buttons in AI Studio
- Copy-to-clipboard success feedback (toast/checkmark)
- Add platform-specific TypeScript interfaces for API responses
- Add Zod runtime validation for platform API responses
- Consider key rotation support in TokenManager
- Track TODOs in issues instead of code comments
- Add `environment: production` approval gate to deploy workflow

---

## What's Actually Good

Credit where it's due — these are solid:

1. **Encryption** — AES-256-GCM with random IV and auth tag for platform tokens
2. **OAuth** — PKCE for TikTok/Twitter, encrypted state cookies, 10-min TTL
3. **All 9 adapters are real** — not stubs. Correct platform-specific quirks (TikTok's `client_key`, Twitter's Basic auth, Meta's token exchange)
4. **Server Component architecture** — only 3 client components in the entire app
5. **Org-scoped queries** — all Prisma queries include `orgId` in WHERE
6. **Optimistic concurrency** — version field on Campaign and Post
7. **Audit logging** — comprehensive trail for state-changing operations
8. **Security headers** — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy all set
9. **Design system** — well-organized CSS custom properties in globals.css
10. **Clean URL structure** — logical hierarchy, route groups don't leak into URLs
11. **73 tests** across shared, platform-sdk, and web packages
12. **Zero `any` types** in the codebase with `strict: true` and `noUncheckedIndexedAccess`

---

## Scores

| Area | Score | Notes |
|------|-------|-------|
| Architecture | 85/100 | Clean monorepo, proper boundaries, good patterns |
| Security | 35/100 | Good crypto/OAuth, but auth disabled, no rate limits, Redis open |
| Frontend UI/UX | 55/100 | Strong design system, but broken on 4 pages, no mobile nav, no components |
| Code Quality | 70/100 | Strict TS, good patterns, but duplication and test gaps |
| Database/API | 60/100 | Good schema, but missing indexes, no pagination, no transactions |
| Platform SDK | 72/100 | All real adapters, but race conditions, no rate limiting, timing attack |
| SEO/Performance | 76/100 | Server-first, good headers, but font blocking, no JSON-LD, missing meta |
| DevOps | 45/100 | No .dockerignore, no migrations, no rollback, broken backups |
| Test Coverage | 40/100 | 73 tests but zero for API routes, workers, or business logic |
| **Overall** | **60/100** | Strong foundation, not production-ready |
