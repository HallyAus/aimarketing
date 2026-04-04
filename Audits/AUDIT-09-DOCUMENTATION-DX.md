# ReachPilot — Audit 9: Documentation & Developer Experience

> **For use in Claude Code against the `HallyAus/aimarketing` repo**
> Run autonomously. Write docs, fix DX issues, commit, move on.

---

## CONTEXT

If you can't onboard a new developer (or your future self 6 months from now) in under 30 minutes, the project is at risk. This audit creates comprehensive documentation, standardizes the development workflow, and ensures the codebase is maintainable.

**Output:** Complete `docs/` directory, updated README, and developer workflow scripts.

---

## PHASE 1: README REWRITE

Rewrite `README.md` to include every section below. This is the single most important documentation file.

### Sections Required:

**1. Project Overview** (2-3 sentences)
- What ReachPilot is, who it's for, what it does

**2. Tech Stack**
- Next.js 15 (App Router), Prisma, PostgreSQL 16, Redis, BullMQ, Stripe, Anthropic Claude API, Tailwind CSS, Vercel

**3. Prerequisites**
- Node.js 20+, Docker & Docker Compose, PostgreSQL client (optional), Redis client (optional)

**4. Getting Started (< 10 minutes)**
```bash
# 1. Clone
git clone git@github.com:HallyAus/aimarketing.git && cd aimarketing

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Fill in required values (see Environment Variables section)

# 4. Start databases
docker compose up -d  # PostgreSQL + Redis

# 5. Run migrations
npx prisma migrate dev

# 6. Seed data (optional)
npx prisma db seed

# 7. Start development server
npm run dev
# → http://localhost:3000

# 8. Start BullMQ workers (separate terminal)
npm run workers
```

**5. Environment Variables**
Table of every variable with: name, required/optional, description, example value.

**6. Project Structure**
```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (marketing)/        # Public marketing pages
│   ├── (auth)/             # Login, signup, password reset
│   ├── dashboard/          # Authenticated user app
│   ├── admin/              # Admin backend
│   └── api/                # API routes
├── components/             # Shared React components
├── lib/                    # Business logic, utilities, services
│   ├── cache.ts            # Redis caching layer
│   ├── encryption.ts       # Token encryption
│   ├── logger.ts           # Structured logging
│   ├── rate-limit.ts       # Rate limiting
│   ├── stripe.ts           # Stripe service
│   ├── timezone.ts         # Timezone utilities
│   ├── oauth/              # Platform-specific OAuth handlers
│   ├── dto/                # Response DTO mappers
│   └── queues.ts           # BullMQ queue definitions
├── workers/                # BullMQ worker processes
│   ├── post-publisher.ts
│   ├── ingestion/          # Historical data ingestion workers
│   └── maintenance.ts
prisma/
├── schema.prisma           # Database schema
├── migrations/             # Migration history
└── seed.ts                 # Seed script
tests/                      # Test suite
docs/                       # Documentation
scripts/                    # Development & ops scripts
```

**7. Available Scripts**
| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run all tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with coverage report |
| `npm run precheck` | Full pre-push validation |
| `npm run workers` | Start BullMQ workers |
| `npm run test:db:up` | Start test database |
| `npm run test:db:down` | Stop test database |

**8. Database**
- How to create a migration: `npx prisma migrate dev --name description`
- How to reset: `npx prisma migrate reset`
- How to view data: `npx prisma studio`
- How to seed: `npx prisma db seed`

**9. Testing**
- Unit tests: `npm run test:unit`
- API tests: `npm run test:api`
- Pre-push check: `npm run precheck`
- Coverage report: `npm run test:coverage` → open `coverage/index.html`

**10. Deployment**
- Vercel auto-deploys from `main` branch
- Preview deployments on pull requests
- Environment variables configured in Vercel dashboard
- Database migrations: run `npx prisma migrate deploy` (automated in CI)

**11. Stripe Setup**
- Create products and prices in Stripe Dashboard
- Configure webhook endpoint: `https://your-domain.com/api/stripe/webhook`
- Required events: list them all
- Test mode vs live mode

**12. Architecture Decisions**
Link to `docs/architecture/` for ADRs

**Footer:**
```markdown
---
☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)
🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.
```

---

## PHASE 2: ARCHITECTURE DECISION RECORDS (ADRs)

Create `docs/architecture/` with one file per decision:

- `001-next-js-app-router.md` — Why App Router over Pages Router
- `002-prisma-over-drizzle.md` — Why Prisma for the ORM
- `003-bullmq-for-scheduling.md` — Why BullMQ over pg-boss, Agenda, or cron
- `004-page-scoped-architecture.md` — Why per-page context, not filtered dashboard
- `005-stripe-for-billing.md` — Why Stripe, webhook-first billing sync
- `006-redis-caching-strategy.md` — What's cached, TTLs, invalidation policy
- `007-token-encryption.md` — How OAuth tokens are encrypted at rest
- `008-timezone-handling.md` — UTC storage, auto-detection, per-user display

Each ADR format:
```markdown
# ADR-001: [Title]
**Date:** YYYY-MM-DD
**Status:** Accepted
**Context:** Why this decision was needed
**Decision:** What was chosen
**Consequences:** Trade-offs and implications
```

---

## PHASE 3: API DOCUMENTATION

Create `docs/api/` with endpoint documentation.

### 3.1 — Public API Docs
For every endpoint available to authenticated users:

```markdown
## POST /api/posts

Create a new post.

**Auth:** Required (session cookie)
**Rate Limit:** 60/min per user

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string | yes | Post content (max 10,000 chars) |
| accountId | string (uuid) | yes | Connected account to post to |
| scheduledAt | string (ISO 8601) | no | Schedule time with timezone offset |
| mediaUrls | string[] | no | Media attachment URLs |

**Response (201):**
```json
{ "data": { "id": "...", "status": "DRAFT", "createdAt": "..." } }
```

**Errors:**
| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 403 | FORBIDDEN | Account doesn't belong to your org |
| 429 | RATE_LIMITED | Too many requests |
```

### 3.2 — Admin API Docs
Same format for every `/api/admin/*` endpoint.

### 3.3 — Webhook Docs
Document the Stripe webhook handler: which events are handled, what each does.

---

## PHASE 4: DATABASE DOCUMENTATION

### 4.1 — Schema Documentation
Create `docs/database/SCHEMA.md`:
- List every model with a 1-line description
- Document all enums and their values
- List key indexes and why they exist
- Note soft-deleted models and the purge schedule

### 4.2 — ER Diagram
Create `docs/database/er-diagram.mermaid`:
```mermaid
erDiagram
  User ||--o{ OrgMember : "belongs to"
  Organisation ||--o{ OrgMember : "has"
  Organisation ||--o{ Team : "has"
  Organisation ||--o{ ConnectedAccount : "owns"
  ConnectedAccount ||--o{ Post : "publishes to"
  ...
```

---

## PHASE 5: OPERATIONAL RUNBOOK

Create `docs/ops/RUNBOOK.md`:

### Incident Response

**Stripe is down:**
1. Billing pages show cached data with "Billing temporarily unavailable" banner
2. Webhook processing pauses (Stripe will retry)
3. No user-facing impact on publishing or content creation

**Social platform API is down:**
1. Publishing queue pauses for that platform
2. Affected posts stay in SCHEDULED status
3. User sees "Publishing delayed" status on affected posts
4. Queue resumes automatically when platform recovers

**Redis is down:**
1. Cache misses — all reads fall back to database (slower but functional)
2. Rate limiting falls back to in-memory
3. BullMQ pauses — scheduled posts delayed until Redis recovers
4. Admin dashboard shows Redis status as "error"

**Database is down:**
1. App returns 503 on all pages
2. Health check reports unhealthy
3. Alert triggers (uptime monitor)

### Maintenance Tasks

- **Monthly:** Review audit logs, clean up soft-deleted records, check token health across all accounts
- **Quarterly:** Review and rotate encryption keys, audit npm dependencies, review Stripe billing reconciliation
- **Annually:** Review and update Terms of Service, Privacy Policy, security practices

---

## PHASE 6: CONTRIBUTING GUIDE

Create `CONTRIBUTING.md`:

### Branching
- `main` — production (auto-deploys to Vercel)
- `develop` — staging
- Feature branches: `feat/description`, `fix/description`

### Commit Convention
- `feat:` — new feature
- `fix:` — bug fix
- `perf:` — performance improvement
- `refactor:` — code restructure
- `test:` — adding/updating tests
- `docs:` — documentation
- `chore:` — maintenance
- `security:` — security fix
- `a11y:` — accessibility fix
- `i18n:` — internationalization
- `seo:` — search optimization
- `ux:` — user experience improvement

### Before Every PR
1. Run `npm run precheck` — must pass
2. Write tests for new features
3. Update docs if you changed API endpoints or database schema
4. Keep PRs focused — one feature/fix per PR

### Code Style
- Files: kebab-case (`my-component.tsx`)
- Components: PascalCase (`MyComponent`)
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/interfaces: PascalCase
- Enums: PascalCase with UPPER_SNAKE values

---

## PHASE 7: PR & ISSUE TEMPLATES

Create `.github/PULL_REQUEST_TEMPLATE.md`:
```markdown
## What
<!-- Brief description of the change -->

## Why
<!-- Why is this change needed? -->

## How
<!-- How does it work? -->

## Testing
- [ ] Unit tests added/updated
- [ ] API tests added/updated
- [ ] Manual testing completed
- [ ] `npm run precheck` passes

## Screenshots
<!-- If UI changes, add before/after screenshots -->
```

Create `.github/ISSUE_TEMPLATE/bug_report.md` and `.github/ISSUE_TEMPLATE/feature_request.md`.

---

## EXECUTION RULES

1. README is the #1 priority — it's what everyone reads first.
2. ADRs and API docs are #2 — they prevent architecture questions.
3. Commit with `docs:` prefix.
4. Run `npm run build` after every phase.

---

☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)
🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.

*Generated for Daniel Hall — ReachPilot / Agentic Consciousness — April 2026*
