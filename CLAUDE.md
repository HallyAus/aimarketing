# Stack
Turborepo monorepo, Next.js 15 App Router, TypeScript strict, Prisma + Neon PostgreSQL, Tailwind, BullMQ workers, Vercel

# Monorepo
apps/web = Next.js frontend + API routes
apps/worker = BullMQ background jobs
packages/db = Prisma schema + client
packages/shared = shared types + utils
packages/platform-sdk = social platform integrations
packages/ui = shared UI components

# Commands
- Build: `pnpm build`
- Dev: `pnpm dev`
- Test: `pnpm test`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- DB generate: `pnpm db:generate`
- DB push: `pnpm db:push`
- DB migrate: `pnpm db:migrate`

# Rules
- Page-scoped: all dashboard queries scoped to ONE Page via PageContext
- Zod validation on all API inputs
- No `any` types
- ES modules only
- Always run `pnpm typecheck` before pushing
- Check Vercel runtime logs for errors before committing
- Fix all errors at once, not one-by-one
- Use parallel subagents for independent tasks

# Do NOT read
- node_modules/
- .next/
- coverage/
- dist/
- prisma/migrations/ (read schema.prisma instead)
- pnpm-lock.yaml

# Compaction rules
When compacting, always preserve:
- Full list of files modified in this session
- Any test/build commands that need to run
- Current task status and next steps
- Any error messages being actively debugged
