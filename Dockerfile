FROM node:20-alpine AS base

# ── Dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY packages/platform-sdk/package.json ./packages/platform-sdk/

RUN pnpm install --frozen-lockfile

# ── Builder ───────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

RUN corepack enable pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/platform-sdk/node_modules ./packages/platform-sdk/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY . .

# Create public dir if missing (Next.js needs it)
RUN mkdir -p apps/web/public

# Generate Prisma client
RUN cd packages/db && npx prisma generate

# Public env vars baked at build time
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_UMAMI_URL
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID

ENV NEXT_TELEMETRY_DISABLED=1

RUN cd apps/web && pnpm build

# Copy Prisma engine to a known location for the runner stages
RUN mkdir -p /prisma-engines && cp -r node_modules/.pnpm/@prisma+client*/node_modules/.prisma /prisma-engines/

# ── Web Runner ────────────────────────────────────────────────────────
FROM base AS web
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
# Prisma query engine for Alpine/musl
COPY --from=builder /prisma-engines/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]

# ── Worker Runner ─────────────────────────────────────────────────────
FROM base AS worker
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable pnpm && apk add --no-cache python3 make g++

# Copy entire workspace — worker uses tsx (not compiled dist)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/platform-sdk/node_modules ./packages/platform-sdk/node_modules
COPY --from=builder /app/apps/worker/src ./apps/worker/src
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder /app/apps/worker/tsconfig.json ./apps/worker/tsconfig.json
COPY --from=builder /app/packages/db/src ./packages/db/src
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /app/packages/shared/src ./packages/shared/src
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/platform-sdk/src ./packages/platform-sdk/src
COPY --from=builder /app/packages/platform-sdk/package.json ./packages/platform-sdk/package.json
COPY --from=builder /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Generate Prisma client in worker context
RUN cd packages/db && npx prisma generate

CMD ["npx", "tsx", "apps/worker/src/index.ts"]
