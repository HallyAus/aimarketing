# Contributing to AdPilot

Thank you for your interest in contributing to AdPilot. This guide covers the conventions and requirements for contributing to the codebase.

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Git

## Getting Started

```bash
git clone https://github.com/HallyAus/aimarketing.git
cd aimarketing
pnpm install
docker compose up -d
cp .env.example .env.local
# Fill in required values
cd packages/db && npx prisma migrate dev
cd ../.. && pnpm dev
```

---

## Branch Naming

| Prefix | Usage |
|--------|-------|
| `feat/` | New feature (`feat/ai-carousel-generator`) |
| `fix/` | Bug fix (`fix/timezone-offset-dst`) |
| `perf/` | Performance improvement (`perf/analytics-query-cache`) |
| `refactor/` | Code restructure (`refactor/post-publisher`) |
| `test/` | Adding or updating tests (`test/stripe-webhook`) |
| `docs/` | Documentation changes (`docs/api-endpoints`) |
| `chore/` | Maintenance (`chore/upgrade-prisma`) |
| `security/` | Security fix (`security/token-rotation`) |

**Protected branches:**
- `main` -- Production. Auto-deploys to Vercel. Direct pushes prohibited.
- `develop` -- Staging integration branch.

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must follow this format:

```
type: short description

Optional longer description explaining the why.
```

### Types

| Type | Description |
|------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `perf:` | Performance improvement |
| `refactor:` | Code restructure (no behavior change) |
| `test:` | Adding or updating tests |
| `docs:` | Documentation only |
| `chore:` | Maintenance, dependency updates |
| `security:` | Security fix |
| `a11y:` | Accessibility improvement |
| `i18n:` | Internationalization |
| `seo:` | Search optimization |
| `ux:` | User experience improvement |

### Examples

```
feat: add AI carousel generator for Instagram
fix: correct DST offset calculation in timezone utility
perf: cache analytics overview query for 5 minutes
refactor: extract post publisher into platform-sdk package
test: add integration tests for Stripe webhook handler
docs: document all API endpoints in docs/api/
security: rotate encryption key and re-encrypt all tokens
```

---

## Code Style

### File Naming

- Files: `kebab-case.ts` (e.g., `rate-limit.ts`, `post-publisher.ts`)
- React components: `kebab-case.tsx` (e.g., `post-card.tsx`)
- Test files: `*.test.ts` or `*.test.tsx`

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `PostCard`, `AnalyticsDashboard` |
| Functions/variables | camelCase | `getActivePageId`, `publishPost` |
| Constants | UPPER_SNAKE_CASE | `MAX_POSTS_PER_MONTH`, `STRIPE_PLAN_PRICES` |
| Types/interfaces | PascalCase | `PostStatus`, `CreatePostInput` |
| Enums | PascalCase name, UPPER_SNAKE values | `enum Plan { FREE, PRO, AGENCY }` |
| Database fields | camelCase | `createdAt`, `platformUserId` |

### Import Order

1. Node.js built-ins (`crypto`, `path`)
2. External packages (`next/server`, `stripe`)
3. Internal packages (`@adpilot/shared`, `@adpilot/db`)
4. Relative imports (`@/lib/...`, `./...`)

### General Rules

- Use TypeScript strict mode. No `any` unless absolutely necessary.
- Prefer `const` over `let`. Never use `var`.
- Use early returns to reduce nesting.
- Keep functions under 50 lines where possible.
- Every API route must validate input and return typed error responses.
- Use the `logger` from `@/lib/logger.ts` instead of `console.log` in production code.

---

## Before Every PR

### 1. Run Pre-check

```bash
pnpm build      # Ensure the project builds
pnpm typecheck  # TypeScript strict mode check
pnpm test       # Run all tests
pnpm lint       # ESLint
```

### 2. Write Tests

- New features must include tests.
- Bug fixes should include a regression test.
- API routes need integration tests (see `apps/web/src/__tests__/api/` for examples).

### 3. Update Documentation

If your change affects:
- **API endpoints** -- Update `docs/api/README.md`
- **Database schema** -- Update `docs/database/README.md`
- **Architecture decisions** -- Add a new ADR in `docs/architecture/`
- **Environment variables** -- Update `.env.example` and the README

### 4. Keep PRs Focused

- One feature or fix per PR.
- If a PR touches more than 10 files, consider splitting it.
- Include screenshots for UI changes.

---

## PR Checklist

Before requesting review, confirm:

- [ ] Branch is up to date with `main`
- [ ] `pnpm build` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] New code has test coverage
- [ ] Documentation updated (if applicable)
- [ ] No secrets or credentials committed
- [ ] Commit messages follow conventional commits

---

## Monorepo Structure

```
adpilot/
  apps/
    web/          # Next.js 15 frontend + API routes
    worker/       # BullMQ queue consumer
  packages/
    db/           # Prisma schema, migrations, seed scripts
    shared/       # Types, validators, encryption, plan limits
    platform-sdk/ # OAuth adapters + token management for 9 platforms
    ui/           # Shared UI components
```

Use Turborepo for builds: `pnpm build` builds all packages in dependency order.

To run commands in a specific package:

```bash
pnpm --filter @adpilot/web dev
pnpm --filter @adpilot/db db:generate
pnpm test --filter @adpilot/shared
```

---

## Database Changes

1. Edit `packages/db/prisma/schema.prisma`
2. Generate client: `cd packages/db && npx prisma generate`
3. Create migration: `npx prisma migrate dev --name describe-your-change`
4. Review the generated SQL in `packages/db/prisma/migrations/`
5. Test the migration against a clean database
6. Commit the schema change, generated migration, and updated Prisma client

---

## Questions?

Open an issue on GitHub or reach out to the project maintainer.

---

License: Private. All rights reserved.
