# Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the ReachPilot monorepo foundation — Turborepo structure, Docker infrastructure, Prisma schema with all models, NextAuth.js v5 authentication, multi-tenant organization/membership system, RBAC middleware, encryption utilities, PlanLimitService with Stripe billing skeleton, and a minimal dashboard shell.

**Architecture:** Turborepo monorepo with pnpm workspaces. `apps/web` is Next.js 15 App Router. `apps/worker` is a BullMQ consumer (skeleton only in Phase 1). `packages/db` holds Prisma schema and client. `packages/shared` holds encryption, validators, types, and PlanLimitService. `packages/ui` holds shared shadcn/ui components. Docker Compose provides PostgreSQL 16 and Redis 7 for local dev.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma v6, NextAuth.js v5, BullMQ, Redis, PostgreSQL 16, Stripe, Zod, Vitest, pnpm

**Spec:** `docs/superpowers/specs/2026-03-29-reachpilot-foundation-design.md`

---

## File Structure

```
reachpilot/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx                    # Root layout with providers
│   │   │   │   ├── page.tsx                      # Landing/marketing page
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── signin/page.tsx           # Sign-in page
│   │   │   │   │   └── invite/[token]/page.tsx   # Invitation accept page
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── layout.tsx                # Dashboard layout with sidebar
│   │   │   │   │   ├── dashboard/page.tsx        # Dashboard home
│   │   │   │   │   ├── org-picker/page.tsx       # Organization picker
│   │   │   │   │   └── settings/
│   │   │   │   │       ├── team/page.tsx         # Team management + invitations
│   │   │   │   │       ├── billing/page.tsx      # Billing + plan management
│   │   │   │   │       └── connections/page.tsx  # Platform connections (stub)
│   │   │   │   └── api/
│   │   │   │       ├── auth/[...nextauth]/route.ts  # NextAuth catch-all
│   │   │   │       ├── health/route.ts              # Health check
│   │   │   │       ├── health/db/route.ts           # DB health check
│   │   │   │       ├── health/redis/route.ts        # Redis health check
│   │   │   │       ├── organizations/route.ts       # Org CRUD
│   │   │   │       ├── organizations/[orgId]/route.ts
│   │   │   │       ├── organizations/[orgId]/members/route.ts
│   │   │   │       ├── organizations/[orgId]/invitations/route.ts
│   │   │   │       ├── webhooks/stripe/route.ts     # Stripe webhooks
│   │   │   │       └── billing/checkout/route.ts    # Stripe checkout session
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts                       # NextAuth config
│   │   │   │   ├── auth-middleware.ts             # withAuth, withOrg, withRole
│   │   │   │   ├── api-handler.ts                # withErrorHandler wrapper
│   │   │   │   ├── rate-limit.ts                 # Rate limiter setup
│   │   │   │   ├── stripe.ts                     # Stripe client + helpers
│   │   │   │   └── redis.ts                      # Redis client singleton
│   │   │   └── middleware.ts                      # Next.js edge middleware
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── package.json
│   └── worker/
│       ├── src/
│       │   ├── index.ts                          # Worker entrypoint
│       │   └── queues.ts                         # Queue definitions
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   ├── db/
│   │   ├── prisma/
│   │   │   ├── schema.prisma                     # Full Prisma schema
│   │   │   └── seed.ts                           # Seed script
│   │   ├── src/
│   │   │   └── index.ts                          # Prisma client export
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── shared/
│   │   ├── src/
│   │   │   ├── index.ts                          # Barrel export
│   │   │   ├── encryption.ts                     # AES-256-GCM encrypt/decrypt
│   │   │   ├── plan-limits.ts                    # PlanLimitService
│   │   │   ├── types.ts                          # Shared TypeScript types
│   │   │   ├── constants.ts                      # Enums, plan configs
│   │   │   └── validators.ts                     # Shared Zod schemas
│   │   ├── __tests__/
│   │   │   ├── encryption.test.ts
│   │   │   ├── plan-limits.test.ts
│   │   │   └── validators.test.ts
│   │   ├── vitest.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── ui/
│   │   ├── src/
│   │   │   └── index.ts                          # Component barrel export
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── platform-sdk/                             # Skeleton for Phase 2
│       ├── src/
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
├── docker-compose.yml                            # Dev: postgres + redis
├── docker-compose.prod.yml                       # Prod: all services
├── Dockerfile                                    # Multi-stage Next.js
├── turbo.json
├── package.json                                  # Root pnpm workspace
├── pnpm-workspace.yaml
├── .env.example
├── .gitignore
└── tsconfig.base.json                            # Shared TS config
```

---

### Task 1: Initialize Turborepo Monorepo

**Files:**
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "reachpilot",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "test:watch": "turbo test:watch",
    "db:generate": "turbo db:generate",
    "db:push": "turbo db:push",
    "db:migrate": "turbo db:migrate",
    "db:seed": "turbo db:seed",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\""
  },
  "devDependencies": {
    "prettier": "^3.4.0",
    "turbo": "^2.3.0",
    "typescript": "^5.7.0"
  },
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": false,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true
  },
  "exclude": ["node_modules", "dist", ".next"]
}
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
.next/
dist/
.turbo/
.env
.env.local
.env.*.local
*.tsbuildinfo
.DS_Store
backups/
```

- [ ] **Step 6: Create .env.example**

Copy the full env vars template from spec Section 15 with placeholder values. All secrets should have `=generate-me` or be empty. Additionally include these vars not in the spec:
```env
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_AGENCY_PRICE_ID=price_xxx
EMAIL_FROM=ReachPilot <noreply@reachpilot.com>
```

- [ ] **Step 7: Install dependencies and verify**

Run: `pnpm install`
Expected: lockfile created, no errors

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize Turborepo monorepo with pnpm workspaces"
```

---

### Task 2: Create packages/db — Prisma Schema

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/prisma/schema.prisma`
- Create: `packages/db/src/index.ts`

- [ ] **Step 1: Create packages/db/package.json**

```json
{
  "name": "@reachpilot/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@prisma/client": "^6.2.0"
  },
  "devDependencies": {
    "prisma": "^6.2.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create packages/db/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create packages/db/prisma/schema.prisma**

This is the full schema from the spec. All models, enums, indexes, and relations:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Enums ────────────────────────────────────────────────────────────────

enum Plan {
  FREE
  PRO
  AGENCY
}

enum Role {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}

enum Platform {
  FACEBOOK
  INSTAGRAM
  TIKTOK
  LINKEDIN
  TWITTER_X
  GOOGLE_ADS
  YOUTUBE
  PINTEREST
  SNAPCHAT
}

enum ConnectionStatus {
  ACTIVE
  EXPIRED
  REVOKED
}

enum CampaignObjective {
  AWARENESS
  TRAFFIC
  ENGAGEMENT
  CONVERSIONS
  LEADS
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  PAUSED
  COMPLETED
  FAILED
}

enum PostStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
  SCHEDULED
  PUBLISHING
  PUBLISHED
  FAILED
  DELETED
}

enum CreativeType {
  IMAGE
  VIDEO
  CAROUSEL
  STORY
  REEL
}

// ── Models ───────────────────────────────────────────────────────────────

model Organization {
  id                   String    @id @default(cuid())
  name                 String
  slug                 String    @unique
  plan                 Plan      @default(FREE)
  stripeCustomerId     String?   @unique
  stripeSubscriptionId String?
  billingEmail         String?
  billingCycleAnchor   DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  deletedAt            DateTime?

  memberships         Membership[]
  invitations         Invitation[]
  platformConnections PlatformConnection[]
  campaigns           Campaign[]
  posts               Post[]
  creatives           Creative[]
  auditLogs           AuditLog[]

  @@index([slug])
  @@index([deletedAt])
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatar        String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())

  memberships       Membership[]
  invitationsSent   Invitation[]   @relation("InvitedBy")
  connectionsAdded  PlatformConnection[] @relation("ConnectedBy")
  campaignsCreated  Campaign[]     @relation("CreatedBy")
  postsApproved     Post[]         @relation("ApprovedBy")
  auditLogs         AuditLog[]

  // NextAuth fields
  accounts Account[]
  sessions Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Membership {
  id         String    @id @default(cuid())
  userId     String
  orgId      String
  role       Role
  invitedBy  String?
  acceptedAt DateTime?
  createdAt  DateTime  @default(now())

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([userId, orgId])
  @@index([orgId])
}

model Invitation {
  id         String    @id @default(cuid())
  orgId      String
  email      String
  role       Role
  token      String    @unique
  expiresAt  DateTime
  invitedBy  String
  acceptedAt DateTime?
  createdAt  DateTime  @default(now())

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  inviter      User         @relation("InvitedBy", fields: [invitedBy], references: [id])

  @@index([orgId])
  @@index([email])
}

model PlatformConnection {
  id                  String           @id @default(cuid())
  orgId               String
  platform            Platform
  accessToken         String           // Encrypted at application level
  refreshToken        String?          // Encrypted at application level
  tokenExpiresAt      DateTime?
  platformUserId      String
  platformAccountName String?
  scopes              String[]
  status              ConnectionStatus @default(ACTIVE)
  connectedBy         String
  metadata            Json?
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  connector    User         @relation("ConnectedBy", fields: [connectedBy], references: [id])

  @@unique([orgId, platform, platformUserId])
  @@index([orgId])
  @@index([platform, status])
}

model Campaign {
  id              String            @id @default(cuid())
  orgId           String
  name            String
  objective       CampaignObjective
  status          CampaignStatus    @default(DRAFT)
  budget          Decimal?          @db.Decimal(12, 2)
  currency        String            @default("USD")
  startDate       DateTime?
  endDate         DateTime?
  targetPlatforms Platform[]
  audienceConfig  Json?
  createdBy       String
  version         Int               @default(1)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  creator      User         @relation("CreatedBy", fields: [createdBy], references: [id])
  posts        Post[]

  @@index([orgId])
  @@index([status])
}

model Post {
  id                 String     @id @default(cuid())
  campaignId         String
  orgId              String
  platform           Platform
  content            String
  mediaUrls          String[]
  scheduledAt        DateTime?
  publishedAt        DateTime?
  platformPostId     String?
  status             PostStatus @default(DRAFT)
  approvedBy         String?
  rejectionReason    String?
  engagementSnapshot Json?
  errorMessage       String?
  version            Int        @default(1)
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  campaign     Campaign          @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  organization Organization      @relation(fields: [orgId], references: [id], onDelete: Cascade)
  approver     User?             @relation("ApprovedBy", fields: [approvedBy], references: [id])
  analytics    AnalyticsSnapshot[]

  @@index([orgId])
  @@index([scheduledAt, status])
  @@index([campaignId])
}

model Creative {
  id            String       @id @default(cuid())
  orgId         String
  name          String
  type          CreativeType
  r2Key         String
  r2Url         String
  thumbnailUrl  String?
  dimensions    String?
  fileSizeBytes Int
  mimeType      String
  tags          String[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId])
}

model AnalyticsSnapshot {
  id           String   @id @default(cuid())
  postId       String
  platform     Platform
  snapshotAt   DateTime
  impressions  Int      @default(0)
  reach        Int      @default(0)
  clicks       Int      @default(0)
  likes        Int      @default(0)
  comments     Int      @default(0)
  shares       Int      @default(0)
  saves        Int      @default(0)
  videoViews   Int      @default(0)
  spend        Decimal  @default(0) @db.Decimal(12, 2)
  conversions  Int      @default(0)
  ctr          Float    @default(0)
  cpc          Decimal  @default(0) @db.Decimal(12, 4)
  cpm          Decimal  @default(0) @db.Decimal(12, 4)
  rawPayload   Json?
  createdAt    DateTime @default(now())

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId])
  @@index([snapshotAt])
}

model AuditLog {
  id         String   @id @default(cuid())
  orgId      String?
  userId     String?
  action     String
  entityType String
  entityId   String
  before     Json?
  after      Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  organization Organization? @relation(fields: [orgId], references: [id])
  user         User?         @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([orgId, createdAt])
  @@index([entityType, entityId])
}

model WebhookEvent {
  id              String   @id @default(cuid())
  platform        String
  eventType       String
  platformEventId String?
  payload         Json
  signature       String?
  verified        Boolean  @default(false)
  processedAt     DateTime?
  processingError String?
  createdAt       DateTime @default(now())

  @@unique([platform, platformEventId])
  @@index([platform, createdAt])
}
```

- [ ] **Step 4: Create packages/db/src/index.ts**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
```

- [ ] **Step 5: Install and generate Prisma client**

Run: `cd packages/db && pnpm install && pnpm db:generate`
Expected: Prisma client generated successfully

- [ ] **Step 6: Commit**

```bash
git add packages/db
git commit -m "feat: add Prisma schema with all models, enums, and indexes"
```

---

### Task 3: Docker Compose for Local Dev

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: reachpilot-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: reachpilot
      POSTGRES_USER: reachpilot
      POSTGRES_PASSWORD: ${DB_PASSWORD:-reachpilot_dev_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U reachpilot"]
      interval: 5s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512M

  redis:
    image: redis:7-alpine
    container_name: reachpilot-redis
    restart: unless-stopped
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 192M

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 2: Start services and verify**

Run: `docker compose up -d`
Expected: Both containers healthy

Run: `docker compose ps`
Expected: `reachpilot-db` and `reachpilot-redis` both `Up (healthy)`

- [ ] **Step 3: Create .env.local for dev**

```env
DATABASE_URL=postgresql://reachpilot:reachpilot_dev_password@localhost:5432/reachpilot
REDIS_URL=redis://localhost:6379
NEXTAUTH_SECRET=dev-secret-change-in-production-min-32-chars
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
MASTER_ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000
NODE_ENV=development
```

Note: `.env.local` is gitignored. The `MASTER_ENCRYPTION_KEY` is a dev-only placeholder (64 hex chars = 32 bytes).

- [ ] **Step 4: Run Prisma migration against local DB**

Run: `cd packages/db && npx prisma migrate dev --name init`
Expected: Migration created and applied successfully

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "feat: add Docker Compose for PostgreSQL and Redis local dev"
```

---

### Task 4: Create packages/shared — Types, Constants, Validators

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/vitest.config.ts`
- Create: `packages/shared/src/types.ts`
- Create: `packages/shared/src/constants.ts`
- Create: `packages/shared/src/validators.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create packages/shared/package.json**

```json
{
  "name": "@reachpilot/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest watch"
  },
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create packages/shared/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

- [ ] **Step 3: Create packages/shared/vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
});
```

- [ ] **Step 4: Create packages/shared/src/constants.ts**

```typescript
export const PLAN_LIMITS = {
  FREE: {
    maxOrganizations: 1,
    maxPlatformConnections: 2,
    maxPostsPerMonth: 10,
    maxTeamMembers: 1,
    analyticsRetentionDays: 30,
    hasApprovalWorkflow: false,
    hasAiInsights: false,
    hasWhiteLabel: false,
    hasApiAccess: false,
    maxUploadSizeBytes: 50 * 1024 * 1024, // 50MB
  },
  PRO: {
    maxOrganizations: 1,
    maxPlatformConnections: 5,
    maxPostsPerMonth: Infinity,
    maxTeamMembers: 5,
    analyticsRetentionDays: 365,
    hasApprovalWorkflow: true,
    hasAiInsights: false,
    hasWhiteLabel: false,
    hasApiAccess: false,
    maxUploadSizeBytes: 200 * 1024 * 1024, // 200MB
  },
  AGENCY: {
    maxOrganizations: Infinity,
    maxPlatformConnections: Infinity,
    maxPostsPerMonth: Infinity,
    maxTeamMembers: Infinity,
    analyticsRetentionDays: Infinity,
    hasApprovalWorkflow: true,
    hasAiInsights: true,
    hasWhiteLabel: true,
    hasApiAccess: true,
    maxUploadSizeBytes: 500 * 1024 * 1024, // 500MB
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export const ROLE_HIERARCHY: Record<string, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const STRIPE_PLAN_PRICE_IDS: Record<string, string> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID ?? "",
  AGENCY: process.env.STRIPE_AGENCY_PRICE_ID ?? "",
};
```

- [ ] **Step 5: Create packages/shared/src/types.ts**

```typescript
export type PlanLimitCheck = {
  allowed: boolean;
  reason: string;
  upgradeRequired?: "PRO" | "AGENCY";
};

export type OrgUsage = {
  platformConnections: number;
  postsThisMonth: number;
  teamMembers: number;
};

export type ApiErrorResponse = {
  error: string;
  code: string;
  statusCode: number;
};
```

- [ ] **Step 6: Create packages/shared/src/validators.ts**

```typescript
import { z } from "zod";

export const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
});

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  billingEmail: z.string().email().optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR", "VIEWER"]),
});
```

- [ ] **Step 7: Create packages/shared/src/index.ts**

```typescript
export * from "./constants";
export * from "./types";
export * from "./validators";
```

- [ ] **Step 8: Install and verify**

Run: `cd packages/shared && pnpm install`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add packages/shared
git commit -m "feat: add shared package with types, constants, and Zod validators"
```

---

### Task 5: Encryption Module with Tests

**Files:**
- Create: `packages/shared/src/encryption.ts`
- Create: `packages/shared/__tests__/encryption.test.ts`

- [ ] **Step 1: Write failing tests for encryption**

Create `packages/shared/__tests__/encryption.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../src/encryption";

const TEST_KEY = "0".repeat(64); // 32 bytes in hex

describe("encryption", () => {
  it("should encrypt and decrypt a string roundtrip", () => {
    const plaintext = "my-secret-access-token";
    const encrypted = encrypt(plaintext, TEST_KEY);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertext for same plaintext (unique IV)", () => {
    const plaintext = "same-token";
    const encrypted1 = encrypt(plaintext, TEST_KEY);
    const encrypted2 = encrypt(plaintext, TEST_KEY);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it("should fail to decrypt with wrong key", () => {
    const plaintext = "secret";
    const encrypted = encrypt(plaintext, TEST_KEY);
    const wrongKey = "1".repeat(64);
    expect(() => decrypt(encrypted, wrongKey)).toThrow();
  });

  it("should handle empty strings", () => {
    const encrypted = encrypt("", TEST_KEY);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe("");
  });

  it("should handle unicode strings", () => {
    const plaintext = "token-with-unicode-\u00e9\u00e8\u00ea";
    const encrypted = encrypt(plaintext, TEST_KEY);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/shared && pnpm test`
Expected: FAIL — `encrypt` and `decrypt` not found

- [ ] **Step 3: Implement encryption module**

Create `packages/shared/src/encryption.ts`:

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns base64-encoded string: IV (12 bytes) + ciphertext + auth tag (16 bytes)
 */
export function encrypt(plaintext: string, hexKey: string): string {
  const key = Buffer.from(hexKey, "hex");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, encrypted, authTag]).toString("base64");
}

/**
 * Decrypt a base64-encoded ciphertext produced by encrypt().
 */
export function decrypt(ciphertext: string, hexKey: string): string {
  const key = Buffer.from(hexKey, "hex");
  const data = Buffer.from(ciphertext, "base64");

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(data.length - AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH, data.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
}
```

- [ ] **Step 4: Export from index**

Add to `packages/shared/src/index.ts`:

```typescript
export { encrypt, decrypt } from "./encryption";
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/shared && pnpm test`
Expected: All 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/encryption.ts packages/shared/__tests__/encryption.test.ts packages/shared/src/index.ts
git commit -m "feat: add AES-256-GCM encryption module with tests"
```

---

### Task 6: PlanLimitService with Tests

**Files:**
- Create: `packages/shared/src/plan-limits.ts`
- Create: `packages/shared/__tests__/plan-limits.test.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/shared/__tests__/plan-limits.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { checkPlanLimit } from "../src/plan-limits";
import type { OrgUsage } from "../src/types";

describe("checkPlanLimit", () => {
  const baseUsage: OrgUsage = {
    platformConnections: 0,
    postsThisMonth: 0,
    teamMembers: 1,
  };

  describe("FREE plan", () => {
    it("should allow connecting platform when under limit", () => {
      const result = checkPlanLimit("FREE", "platformConnections", {
        ...baseUsage,
        platformConnections: 1,
      });
      expect(result.allowed).toBe(true);
    });

    it("should deny connecting platform when at limit", () => {
      const result = checkPlanLimit("FREE", "platformConnections", {
        ...baseUsage,
        platformConnections: 2,
      });
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe("PRO");
    });

    it("should allow creating post when under limit", () => {
      const result = checkPlanLimit("FREE", "postsThisMonth", {
        ...baseUsage,
        postsThisMonth: 9,
      });
      expect(result.allowed).toBe(true);
    });

    it("should deny creating post when at limit", () => {
      const result = checkPlanLimit("FREE", "postsThisMonth", {
        ...baseUsage,
        postsThisMonth: 10,
      });
      expect(result.allowed).toBe(false);
    });

    it("should deny inviting member (limit is 1)", () => {
      const result = checkPlanLimit("FREE", "teamMembers", {
        ...baseUsage,
        teamMembers: 1,
      });
      expect(result.allowed).toBe(false);
    });
  });

  describe("PRO plan", () => {
    it("should allow up to 5 platform connections", () => {
      const result = checkPlanLimit("PRO", "platformConnections", {
        ...baseUsage,
        platformConnections: 4,
      });
      expect(result.allowed).toBe(true);
    });

    it("should deny 6th platform connection", () => {
      const result = checkPlanLimit("PRO", "platformConnections", {
        ...baseUsage,
        platformConnections: 5,
      });
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe("AGENCY");
    });

    it("should allow unlimited posts", () => {
      const result = checkPlanLimit("PRO", "postsThisMonth", {
        ...baseUsage,
        postsThisMonth: 99999,
      });
      expect(result.allowed).toBe(true);
    });
  });

  describe("AGENCY plan", () => {
    it("should allow unlimited everything", () => {
      const result = checkPlanLimit("AGENCY", "platformConnections", {
        ...baseUsage,
        platformConnections: 100,
      });
      expect(result.allowed).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/shared && pnpm test`
Expected: FAIL — `checkPlanLimit` not found

- [ ] **Step 3: Implement PlanLimitService**

Create `packages/shared/src/plan-limits.ts`:

```typescript
import { PLAN_LIMITS, type PlanType } from "./constants";
import type { PlanLimitCheck, OrgUsage } from "./types";

const LIMIT_MAP: Record<keyof OrgUsage, keyof (typeof PLAN_LIMITS)["FREE"]> = {
  platformConnections: "maxPlatformConnections",
  postsThisMonth: "maxPostsPerMonth",
  teamMembers: "maxTeamMembers",
};

const UPGRADE_PATH: Record<PlanType, PlanType | undefined> = {
  FREE: "PRO",
  PRO: "AGENCY",
  AGENCY: undefined,
};

export function checkPlanLimit(
  plan: PlanType,
  resource: keyof OrgUsage,
  usage: OrgUsage
): PlanLimitCheck {
  const limits = PLAN_LIMITS[plan];
  const limitKey = LIMIT_MAP[resource];
  const max = limits[limitKey] as number;
  const current = usage[resource];

  if (current < max) {
    return { allowed: true, reason: "" };
  }

  const upgrade = UPGRADE_PATH[plan];
  return {
    allowed: false,
    reason: `You've reached the ${resource} limit for the ${plan} plan.`,
    upgradeRequired: upgrade as "PRO" | "AGENCY" | undefined,
  };
}

export function checkFeatureAccess(
  plan: PlanType,
  feature: "hasApprovalWorkflow" | "hasAiInsights" | "hasWhiteLabel" | "hasApiAccess"
): PlanLimitCheck {
  const limits = PLAN_LIMITS[plan];
  if (limits[feature]) {
    return { allowed: true, reason: "" };
  }

  const upgrade = UPGRADE_PATH[plan];
  return {
    allowed: false,
    reason: `This feature requires a ${upgrade ?? "higher"} plan.`,
    upgradeRequired: upgrade as "PRO" | "AGENCY" | undefined,
  };
}
```

- [ ] **Step 4: Export from index**

Add to `packages/shared/src/index.ts`:

```typescript
export { checkPlanLimit, checkFeatureAccess } from "./plan-limits";
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/shared && pnpm test`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/plan-limits.ts packages/shared/__tests__/plan-limits.test.ts packages/shared/src/index.ts
git commit -m "feat: add PlanLimitService with plan enforcement and tests"
```

---

### Task 7: Create packages/ui Skeleton

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/src/index.ts`

- [ ] **Step 1: Create packages/ui/package.json**

```json
{
  "name": "@reachpilot/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create packages/ui/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create packages/ui/src/index.ts**

```typescript
// shadcn/ui components will be added here as needed
export {};
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui
git commit -m "feat: add UI package skeleton for shared shadcn/ui components"
```

---

### Task 8: Initialize Next.js 15 App (apps/web)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/globals.css`

- [ ] **Step 1: Create apps/web/package.json**

```json
{
  "name": "@reachpilot/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest watch"
  },
  "dependencies": {
    "@reachpilot/db": "workspace:*",
    "@reachpilot/shared": "workspace:*",
    "@reachpilot/ui": "workspace:*",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "^5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.7.0",
    "stripe": "^17.4.0",
    "bullmq": "^5.30.0",
    "ioredis": "^5.4.0",
    "rate-limiter-flexible": "^5.0.0",
    "zod": "^3.24.0",
    "resend": "^4.0.0",
    "posthog-js": "^1.200.0",
    "posthog-node": "^4.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create apps/web/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create apps/web/next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@reachpilot/db", "@reachpilot/shared", "@reachpilot/ui"],
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Content-Security-Policy",
          value:
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://app.posthog.com https://api.stripe.com;",
        },
      ],
    },
  ],
};

export default nextConfig;
```

- [ ] **Step 4: Create Tailwind config and PostCSS config**

Create `apps/web/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

Create `apps/web/postcss.config.js`:

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 5: Create root layout**

Create `apps/web/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Create `apps/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReachPilot — Automated Marketing Agency",
  description: "Manage campaigns across all social platforms from one dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Create landing page**

Create `apps/web/src/app/page.tsx`:

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">ReachPilot</h1>
      <p className="text-lg text-gray-600 mb-8">
        Automated marketing agency platform
      </p>
      <Link
        href="/signin"
        className="rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
      >
        Get Started
      </Link>
    </main>
  );
}
```

- [ ] **Step 7: Install dependencies and verify dev server starts**

Run: `pnpm install && cd apps/web && pnpm dev`
Expected: Next.js dev server starts on http://localhost:3000, page renders

- [ ] **Step 8: Commit**

```bash
git add apps/web
git commit -m "feat: initialize Next.js 15 app with Tailwind CSS and security headers"
```

---

### Task 9: NextAuth.js v5 Configuration

**Files:**
- Create: `apps/web/src/lib/auth.ts`
- Create: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- Create: `apps/web/src/app/(auth)/signin/page.tsx`

- [ ] **Step 1: Create NextAuth config**

Create `apps/web/src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { prisma } from "@reachpilot/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.EMAIL_FROM ?? "ReachPilot <noreply@reachpilot.com>",
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }

      // Load org context if not set
      if (token.userId && !token.currentOrgId) {
        const memberships = await prisma.membership.findMany({
          where: { userId: token.userId as string },
          include: { organization: true },
          orderBy: { createdAt: "asc" },
        });

        if (memberships.length === 1) {
          token.currentOrgId = memberships[0].orgId;
          token.currentRole = memberships[0].role;
        }
        // If 0 or multiple, leave unset — user goes to org picker
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.currentOrgId = token.currentOrgId as string | undefined;
        session.user.currentRole = token.currentRole as string | undefined;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
```

- [ ] **Step 2: Create NextAuth route handler**

Create `apps/web/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Create NextAuth type augmentation**

Create `apps/web/src/lib/auth-types.d.ts`:

```typescript
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      currentOrgId?: string;
      currentRole?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    currentOrgId?: string;
    currentRole?: string;
  }
}
```

- [ ] **Step 4: Create sign-in page**

Create `apps/web/src/app/(auth)/signin/page.tsx`:

```tsx
import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to ReachPilot</h1>
          <p className="text-sm text-gray-500 mt-2">
            Manage your marketing campaigns
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Continue with Google
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("resend", {
              email: formData.get("email") as string,
              redirectTo: "/dashboard",
            });
          }}
          className="space-y-4"
        >
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Send Magic Link
          </button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/auth.ts apps/web/src/lib/auth-types.d.ts apps/web/src/app/api/auth apps/web/src/app/\(auth\)
git commit -m "feat: add NextAuth.js v5 with Google OAuth and magic link sign-in"
```

---

### Task 10: RBAC Middleware & API Handler

**Files:**
- Create: `apps/web/src/lib/auth-middleware.ts`
- Create: `apps/web/src/lib/api-handler.ts`
- Create: `apps/web/src/lib/redis.ts`
- Create: `apps/web/src/lib/rate-limit.ts`
- Create: `apps/web/src/middleware.ts`

- [ ] **Step 1: Create Redis client**

Create `apps/web/src/lib/redis.ts`:

```typescript
import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: IORedis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
```

- [ ] **Step 2: Create rate limiter**

Create `apps/web/src/lib/rate-limit.ts`:

```typescript
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "./redis";

export const authRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:auth",
  points: 5,
  duration: 60, // 5 requests per minute
});

export const apiRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:api",
  points: 100,
  duration: 60, // 100 requests per minute
});
```

- [ ] **Step 3: Create auth middleware helpers**

Create `apps/web/src/lib/auth-middleware.ts`:

```typescript
import { auth } from "./auth";
import { prisma } from "@reachpilot/db";
import { ROLE_HIERARCHY } from "@reachpilot/shared";
import { NextRequest, NextResponse } from "next/server";

type AuthenticatedRequest = NextRequest & {
  userId: string;
  orgId: string;
  role: string;
};

type RouteHandler = (
  req: AuthenticatedRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with auth + org context checks.
 */
export function withAuth(handler: RouteHandler): (req: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
  return async (req: NextRequest, context) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 },
        { status: 401 }
      );
    }

    const orgId = session.user.currentOrgId;
    if (!orgId) {
      return NextResponse.json(
        { error: "No organization selected", code: "NO_ORG", statusCode: 403 },
        { status: 403 }
      );
    }

    const authReq = req as AuthenticatedRequest;
    authReq.userId = session.user.id;
    authReq.orgId = orgId;
    authReq.role = session.user.currentRole ?? "VIEWER";

    return handler(authReq, context);
  };
}

/**
 * Wraps a handler with minimum role requirement.
 */
export function withRole(minimumRole: string, handler: RouteHandler): (req: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
  return withAuth(async (req, context) => {
    const userLevel = ROLE_HIERARCHY[req.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 999;

    if (userLevel < requiredLevel) {
      return NextResponse.json(
        {
          error: "Insufficient permissions",
          code: "FORBIDDEN",
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    return handler(req, context);
  });
}
```

- [ ] **Step 4: Create API error handler wrapper**

Create `apps/web/src/lib/api-handler.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export function withErrorHandler(
  handler: (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("[API Error]", {
        path: req.nextUrl.pathname,
        method: req.method,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      if (error instanceof ZodValidationError) {
        return NextResponse.json(
          { error: error.message, code: "VALIDATION_ERROR", statusCode: 400 },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR", statusCode: 500 },
        { status: 500 }
      );
    }
  };
}

export class ZodValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZodValidationError";
  }
}
```

- [ ] **Step 5: Create Next.js edge middleware**

Create `apps/web/src/middleware.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./lib/auth";

export default auth((req) => {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (!req.auth) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

  return response;
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/redis.ts apps/web/src/lib/rate-limit.ts apps/web/src/lib/auth-middleware.ts apps/web/src/lib/api-handler.ts apps/web/src/middleware.ts
git commit -m "feat: add RBAC middleware, rate limiting, and API error handler"
```

---

### Task 11: Organization CRUD API Routes

**Files:**
- Create: `apps/web/src/app/api/organizations/route.ts`
- Create: `apps/web/src/app/api/organizations/[orgId]/route.ts`

- [ ] **Step 1: Create organization list + create route**

Create `apps/web/src/app/api/organizations/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { withErrorHandler, ZodValidationError } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { createOrgSchema, checkPlanLimit } from "@reachpilot/shared";

// GET /api/organizations — list user's organizations
export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, { status: 401 });
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          createdAt: true,
        },
      },
    },
  });

  return NextResponse.json(
    memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }))
  );
});

// POST /api/organizations — create a new organization
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Check if slug is taken
  const existing = await prisma.organization.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Slug already taken", code: "SLUG_TAKEN", statusCode: 409 },
      { status: 409 }
    );
  }

  // Check org limit for current user
  const orgCount = await prisma.membership.count({
    where: { userId: session.user.id, role: "OWNER" },
  });

  // For now, use FREE plan limit. Will be refined when we check user's highest plan.
  if (orgCount >= 1) {
    // Check if user has any AGENCY plan orgs (which allow unlimited)
    const agencyOrg = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        role: "OWNER",
        organization: { plan: "AGENCY" },
      },
    });
    if (!agencyOrg) {
      return NextResponse.json(
        { error: "Organization limit reached for your plan", code: "PLAN_LIMIT", statusCode: 403 },
        { status: 403 }
      );
    }
  }

  const org = await prisma.organization.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER",
          acceptedAt: new Date(),
        },
      },
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      orgId: org.id,
      userId: session.user.id,
      action: "CREATE",
      entityType: "Organization",
      entityId: org.id,
      after: { name: org.name, slug: org.slug },
      ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip"),
    },
  });

  return NextResponse.json(org, { status: 201 });
});
```

- [ ] **Step 2: Create organization detail + update route**

Create `apps/web/src/app/api/organizations/[orgId]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { withErrorHandler } from "@/lib/api-handler";
import { prisma } from "@reachpilot/db";
import { updateOrgSchema } from "@reachpilot/shared";

// GET /api/organizations/[orgId]
export const GET = withErrorHandler(withRole("VIEWER", async (req, context) => {
  const { orgId } = await context.params;

  const org = await prisma.organization.findUnique({
    where: { id: orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      billingEmail: true,
      createdAt: true,
      _count: {
        select: {
          memberships: true,
          platformConnections: true,
          campaigns: true,
        },
      },
    },
  });

  if (!org) {
    return NextResponse.json({ error: "Not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  return NextResponse.json(org);
}));

// PATCH /api/organizations/[orgId]
export const PATCH = withErrorHandler(withRole("OWNER", async (req, context) => {
  const { orgId } = await context.params;
  const body = await req.json();
  const parsed = updateOrgSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const before = await prisma.organization.findUnique({ where: { id: orgId } });

  const org = await prisma.organization.update({
    where: { id: orgId },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      userId: req.userId,
      action: "UPDATE",
      entityType: "Organization",
      entityId: orgId,
      before: before ? { name: before.name, billingEmail: before.billingEmail } : undefined,
      after: parsed.data,
    },
  });

  return NextResponse.json(org);
}));

// DELETE /api/organizations/[orgId] — soft delete
export const DELETE = withErrorHandler(withRole("OWNER", async (req, context) => {
  const { orgId } = await context.params;

  await prisma.organization.update({
    where: { id: orgId },
    data: { deletedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      orgId,
      userId: req.userId,
      action: "DELETE",
      entityType: "Organization",
      entityId: orgId,
    },
  });

  return NextResponse.json({ success: true });
}));
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/organizations
git commit -m "feat: add organization CRUD API routes with RBAC and audit logging"
```

---

### Task 12: Team Members & Invitations API

**Files:**
- Create: `apps/web/src/app/api/organizations/[orgId]/members/route.ts`
- Create: `apps/web/src/app/api/organizations/[orgId]/invitations/route.ts`
- Create: `apps/web/src/app/(auth)/invite/[token]/page.tsx`

- [ ] **Step 1: Create members route**

Create `apps/web/src/app/api/organizations/[orgId]/members/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@reachpilot/db";
import { updateMemberRoleSchema } from "@reachpilot/shared";
import { ZodValidationError } from "@/lib/api-handler";

// GET /api/organizations/[orgId]/members
export const GET = withRole("VIEWER", async (req, context) => {
  const { orgId } = await context.params;

  const members = await prisma.membership.findMany({
    where: { orgId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
});

// PATCH /api/organizations/[orgId]/members — update member role
export const PATCH = withRole("ADMIN", async (req, context) => {
  const { orgId } = await context.params;
  const body = await req.json();
  const { memberId, ...roleData } = body;
  const parsed = updateMemberRoleSchema.safeParse(roleData);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Prevent changing OWNER role
  const target = await prisma.membership.findUnique({ where: { id: memberId } });
  if (!target || target.orgId !== orgId) {
    return NextResponse.json({ error: "Member not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot change owner role", code: "FORBIDDEN", statusCode: 403 }, { status: 403 });
  }

  const updated = await prisma.membership.update({
    where: { id: memberId },
    data: { role: parsed.data.role },
  });

  return NextResponse.json(updated);
});

// DELETE /api/organizations/[orgId]/members — remove member
export const DELETE = withRole("ADMIN", async (req, context) => {
  const { orgId } = await context.params;
  const { memberId } = await req.json();

  const target = await prisma.membership.findUnique({ where: { id: memberId } });
  if (!target || target.orgId !== orgId) {
    return NextResponse.json({ error: "Member not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }
  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove owner", code: "FORBIDDEN", statusCode: 403 }, { status: 403 });
  }

  await prisma.membership.delete({ where: { id: memberId } });

  await prisma.auditLog.create({
    data: {
      orgId,
      userId: req.userId,
      action: "REMOVE_MEMBER",
      entityType: "Membership",
      entityId: memberId,
    },
  });

  return NextResponse.json({ success: true });
});
```

- [ ] **Step 2: Create invitations route**

Create `apps/web/src/app/api/organizations/[orgId]/invitations/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { prisma } from "@reachpilot/db";
import { inviteMemberSchema, checkPlanLimit } from "@reachpilot/shared";
import { ZodValidationError } from "@/lib/api-handler";
import { randomBytes } from "crypto";

// GET /api/organizations/[orgId]/invitations — list pending
export const GET = withRole("ADMIN", async (req, context) => {
  const { orgId } = await context.params;

  const invitations = await prisma.invitation.findMany({
    where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
});

// POST /api/organizations/[orgId]/invitations — invite member
export const POST = withRole("ADMIN", async (req, context) => {
  const { orgId } = await context.params;
  const body = await req.json();
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    throw new ZodValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Check plan limit
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    return NextResponse.json({ error: "Org not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  const memberCount = await prisma.membership.count({ where: { orgId } });
  const limitCheck = checkPlanLimit(org.plan, "teamMembers", {
    platformConnections: 0,
    postsThisMonth: 0,
    teamMembers: memberCount,
  });
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.reason, code: "PLAN_LIMIT", statusCode: 403, upgradeRequired: limitCheck.upgradeRequired },
      { status: 403 }
    );
  }

  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: { userId_orgId: { userId: existingUser.id, orgId } },
    });
    if (existingMembership) {
      return NextResponse.json({ error: "Already a member", code: "ALREADY_MEMBER", statusCode: 409 }, { status: 409 });
    }
  }

  // Create invitation
  const token = randomBytes(32).toString("hex");
  const invitation = await prisma.invitation.create({
    data: {
      orgId,
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      invitedBy: req.userId,
    },
  });

  // TODO: Send invitation email via Resend (will be implemented with email:send queue)

  await prisma.auditLog.create({
    data: {
      orgId,
      userId: req.userId,
      action: "INVITE_MEMBER",
      entityType: "Invitation",
      entityId: invitation.id,
      after: { email: parsed.data.email, role: parsed.data.role },
    },
  });

  return NextResponse.json(invitation, { status: 201 });
});
```

- [ ] **Step 3: Create invitation accept page**

Create `apps/web/src/app/(auth)/invite/[token]/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@reachpilot/db";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold">Invalid or Expired Invitation</h1>
          <p className="text-gray-500 mt-2">
            This invitation link is no longer valid.
          </p>
        </div>
      </main>
    );
  }

  // If not signed in, redirect to sign-in with return URL
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/invite/${token}`);
  }

  // Accept invitation
  await prisma.$transaction([
    prisma.membership.create({
      data: {
        userId: session.user.id,
        orgId: invitation.orgId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        acceptedAt: new Date(),
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  redirect("/dashboard");
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/organizations/\[orgId\]/members apps/web/src/app/api/organizations/\[orgId\]/invitations apps/web/src/app/\(auth\)/invite
git commit -m "feat: add team members, invitations API, and invitation accept flow"
```

---

### Task 13: Stripe Billing Integration

**Files:**
- Create: `apps/web/src/lib/stripe.ts`
- Create: `apps/web/src/app/api/billing/checkout/route.ts`
- Create: `apps/web/src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Create Stripe client + helpers**

Create `apps/web/src/lib/stripe.ts`:

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const STRIPE_PLAN_PRICES: Record<string, string> = {
  PRO: process.env.STRIPE_PRO_PRICE_ID ?? "",
  AGENCY: process.env.STRIPE_AGENCY_PRICE_ID ?? "",
};
```

- [ ] **Step 2: Create checkout session route**

Create `apps/web/src/app/api/billing/checkout/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { withRole } from "@/lib/auth-middleware";
import { stripe, STRIPE_PLAN_PRICES } from "@/lib/stripe";
import { prisma } from "@reachpilot/db";

// POST /api/billing/checkout — create Stripe Checkout session
export const POST = withRole("OWNER", async (req) => {
  const { plan } = await req.json();
  if (!plan || !STRIPE_PLAN_PRICES[plan]) {
    return NextResponse.json(
      { error: "Invalid plan", code: "INVALID_PLAN", statusCode: 400 },
      { status: 400 }
    );
  }

  const org = await prisma.organization.findUnique({
    where: { id: req.orgId },
  });
  if (!org) {
    return NextResponse.json({ error: "Org not found", code: "NOT_FOUND", statusCode: 404 }, { status: 404 });
  }

  // Create or retrieve Stripe customer
  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org.billingEmail ?? undefined,
      metadata: { orgId: org.id, orgSlug: org.slug },
    });
    customerId = customer.id;
    await prisma.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: STRIPE_PLAN_PRICES[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
    metadata: { orgId: org.id, plan },
  });

  return NextResponse.json({ url: session.url });
});
```

- [ ] **Step 3: Create Stripe webhook handler**

Create `apps/web/src/app/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@reachpilot/db";
import type { Plan } from "@reachpilot/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orgId = session.metadata?.orgId;
      const plan = session.metadata?.plan as Plan;
      if (orgId && plan) {
        await prisma.organization.update({
          where: { id: orgId },
          data: {
            plan,
            stripeSubscriptionId: session.subscription as string,
            billingCycleAnchor: new Date(),
          },
        });
        await prisma.auditLog.create({
          data: {
            orgId,
            action: "PLAN_UPGRADE",
            entityType: "Organization",
            entityId: orgId,
            after: { plan },
          },
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;
      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: { billingCycleAnchor: new Date() },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;
      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (org) {
        // TODO: Send warning email, start 3-day grace period
        await prisma.auditLog.create({
          data: {
            orgId: org.id,
            action: "PAYMENT_FAILED",
            entityType: "Organization",
            entityId: org.id,
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;
      const org = await prisma.organization.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: { plan: "FREE", stripeSubscriptionId: null },
        });
        await prisma.auditLog.create({
          data: {
            orgId: org.id,
            action: "PLAN_DOWNGRADE",
            entityType: "Organization",
            entityId: org.id,
            after: { plan: "FREE" },
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/stripe.ts apps/web/src/app/api/billing apps/web/src/app/api/webhooks/stripe
git commit -m "feat: add Stripe billing with checkout sessions and webhook handling"
```

---

### Task 14: Health Check Endpoints

**Files:**
- Create: `apps/web/src/app/api/health/route.ts`
- Create: `apps/web/src/app/api/health/db/route.ts`
- Create: `apps/web/src/app/api/health/redis/route.ts`

- [ ] **Step 1: Create health check routes**

Create `apps/web/src/app/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
```

Create `apps/web/src/app/api/health/db/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@reachpilot/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", service: "postgresql" });
  } catch (error) {
    return NextResponse.json(
      { status: "error", service: "postgresql", error: String(error) },
      { status: 503 }
    );
  }
}
```

Create `apps/web/src/app/api/health/redis/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    const pong = await redis.ping();
    return NextResponse.json({ status: "ok", service: "redis", response: pong });
  } catch (error) {
    return NextResponse.json(
      { status: "error", service: "redis", error: String(error) },
      { status: 503 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/api/health
git commit -m "feat: add health check endpoints for app, database, and Redis"
```

---

### Task 15: Worker Skeleton (apps/worker)

**Files:**
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/src/queues.ts`
- Create: `apps/worker/src/index.ts`

- [ ] **Step 1: Create apps/worker/package.json**

```json
{
  "name": "@reachpilot/worker",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "tsx src/index.ts"
  },
  "dependencies": {
    "@reachpilot/db": "workspace:*",
    "@reachpilot/shared": "workspace:*",
    "bullmq": "^5.30.0",
    "ioredis": "^5.4.0"
  },
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Create apps/worker/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create queue definitions**

Create `apps/worker/src/queues.ts`:

```typescript
import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// ── Queue Definitions ────────────────────────────────────────────────────

export const queues = {
  "campaign:publish": new Queue("campaign:publish", { connection }),
  "campaign:schedule": new Queue("campaign:schedule", { connection }),
  "analytics:sync": new Queue("analytics:sync", { connection }),
  "token:refresh": new Queue("token:refresh", { connection }),
  "token:health-check": new Queue("token:health-check", { connection }),
  "media:process": new Queue("media:process", { connection }),
  "email:send": new Queue("email:send", { connection }),
  "webhook:process": new Queue("webhook:process", { connection }),
} as const;

// ── Worker Factory ────────────────────────────────────────────────────────

export function createWorker(
  queueName: string,
  processor: (job: Job) => Promise<void>,
  concurrency: number = 1
): Worker {
  const worker = new Worker(queueName, processor, {
    connection,
    concurrency,
  });

  worker.on("completed", (job) => {
    console.log(`[${queueName}] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[${queueName}] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

export { connection };
```

- [ ] **Step 4: Create worker entrypoint**

Create `apps/worker/src/index.ts`:

```typescript
import { createWorker, queues, connection } from "./queues";
import type { Job } from "bullmq";

console.log("ReachPilot Worker starting...");

// ── Placeholder processors (implemented in later phases) ─────────────────

const placeholderProcessor = async (job: Job) => {
  console.log(`[placeholder] Processing job ${job.id} from ${job.queueName}`, job.data);
};

// ── Start Workers ────────────────────────────────────────────────────────

const workers = [
  createWorker("campaign:publish", placeholderProcessor, 5),
  createWorker("campaign:schedule", placeholderProcessor, 1),
  createWorker("analytics:sync", placeholderProcessor, 3),
  createWorker("token:refresh", placeholderProcessor, 2),
  createWorker("token:health-check", placeholderProcessor, 2),
  createWorker("media:process", placeholderProcessor, 2),
  createWorker("email:send", placeholderProcessor, 3),
  createWorker("webhook:process", placeholderProcessor, 3),
];

// ── Scheduled Jobs (repeatable) ──────────────────────────────────────────

async function setupScheduledJobs() {
  await queues["campaign:schedule"].upsertJobScheduler(
    "campaign-schedule-check",
    { every: 60_000 }, // every minute
    { data: {} }
  );

  await queues["token:refresh"].upsertJobScheduler(
    "token-refresh-check",
    { every: 12 * 60 * 60_000 }, // every 12 hours
    { data: {} }
  );

  await queues["token:health-check"].upsertJobScheduler(
    "token-health-check",
    { every: 6 * 60 * 60_000 }, // every 6 hours
    { data: {} }
  );

  await queues["analytics:sync"].upsertJobScheduler(
    "analytics-sync-active",
    { every: 4 * 60 * 60_000 }, // every 4 hours
    { data: { type: "active" } }
  );

  console.log("Scheduled jobs configured");
}

setupScheduledJobs().catch(console.error);

// ── Graceful shutdown ────────────────────────────────────────────────────

async function shutdown() {
  console.log("Shutting down workers...");
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log(`ReachPilot Worker running with ${workers.length} queue consumers`);
```

- [ ] **Step 5: Install and verify worker starts**

Run: `pnpm install && cd apps/worker && pnpm dev`
Expected: Worker starts, logs "ReachPilot Worker running with 8 queue consumers"

- [ ] **Step 6: Commit**

```bash
git add apps/worker
git commit -m "feat: add BullMQ worker skeleton with queue definitions and scheduled jobs"
```

---

### Task 16: Dashboard Shell & Org Picker

**Files:**
- Create: `apps/web/src/app/(dashboard)/layout.tsx`
- Create: `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- Create: `apps/web/src/app/(dashboard)/org-picker/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/team/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/billing/page.tsx`
- Create: `apps/web/src/app/(dashboard)/settings/connections/page.tsx`

- [ ] **Step 1: Create dashboard layout**

Create `apps/web/src/app/(dashboard)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50 p-4">
        <div className="font-bold text-lg mb-8">ReachPilot</div>
        <nav className="space-y-1">
          <Link href="/dashboard" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
            Dashboard
          </Link>
          <Link href="/dashboard/campaigns" className="block rounded px-3 py-2 text-sm hover:bg-gray-200 text-gray-400">
            Campaigns (Phase 3)
          </Link>
          <Link href="/dashboard/analytics" className="block rounded px-3 py-2 text-sm hover:bg-gray-200 text-gray-400">
            Analytics (Phase 5)
          </Link>
          <div className="pt-4 mt-4 border-t">
            <div className="text-xs font-medium text-gray-400 uppercase mb-2">Settings</div>
            <Link href="/dashboard/settings/connections" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
              Connections
            </Link>
            <Link href="/dashboard/settings/team" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
              Team
            </Link>
            <Link href="/dashboard/settings/billing" className="block rounded px-3 py-2 text-sm hover:bg-gray-200">
              Billing
            </Link>
          </div>
        </nav>
        <div className="absolute bottom-4 text-xs text-gray-400">
          {session.user.email}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create dashboard home page**

Create `apps/web/src/app/(dashboard)/dashboard/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@reachpilot/db";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.currentOrgId) {
    redirect("/org-picker");
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.currentOrgId },
    include: {
      _count: {
        select: {
          platformConnections: true,
          campaigns: true,
          memberships: true,
        },
      },
    },
  });

  if (!org) {
    redirect("/org-picker");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{org.name}</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Connected Platforms</div>
          <div className="text-3xl font-bold">{org._count.platformConnections}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Campaigns</div>
          <div className="text-3xl font-bold">{org._count.campaigns}</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-sm text-gray-500">Team Members</div>
          <div className="text-3xl font-bold">{org._count.memberships}</div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        Plan: <span className="font-medium">{org.plan}</span>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create org picker page**

Create `apps/web/src/app/(dashboard)/org-picker/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@reachpilot/db";
import Link from "next/link";

export default async function OrgPickerPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        select: { id: true, name: true, slug: true, plan: true },
      },
    },
  });

  if (memberships.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <h1 className="text-xl font-bold mb-4">Create Your Organization</h1>
        <p className="text-gray-500 mb-6">Get started by creating your first organization.</p>
        <Link
          href="/dashboard/create-org"
          className="rounded-md bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700"
        >
          Create Organization
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-xl font-bold mb-6">Select Organization</h1>
      <div className="space-y-2">
        {memberships.map((m) => (
          <button
            key={m.organization.id}
            className="w-full text-left border rounded-lg p-4 hover:bg-gray-50"
          >
            <div className="font-medium">{m.organization.name}</div>
            <div className="text-sm text-gray-500">
              {m.organization.plan} &middot; {m.role}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create settings stub pages**

Create `apps/web/src/app/(dashboard)/settings/connections/page.tsx`:

```tsx
export default function ConnectionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Platform Connections</h1>
      <p className="text-gray-500">Connect your social media platforms here. Coming in Phase 2.</p>
    </div>
  );
}
```

Create `apps/web/src/app/(dashboard)/settings/team/page.tsx`:

```tsx
export default function TeamPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Team Management</h1>
      <p className="text-gray-500">Manage team members and invitations.</p>
    </div>
  );
}
```

Create `apps/web/src/app/(dashboard)/settings/billing/page.tsx`:

```tsx
export default function BillingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Billing & Plan</h1>
      <p className="text-gray-500">Manage your subscription and billing.</p>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(dashboard\)
git commit -m "feat: add dashboard shell with org picker and settings stub pages"
```

---

### Task 17: Prisma Seed Script

**Files:**
- Create: `packages/db/prisma/seed.ts`

- [ ] **Step 1: Create seed script**

Create `packages/db/prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: "admin@reachpilot.dev" },
    update: {},
    create: {
      email: "admin@reachpilot.dev",
      name: "ReachPilot Admin",
      emailVerified: new Date(),
    },
  });

  // Create test organization
  const org = await prisma.organization.upsert({
    where: { slug: "demo-agency" },
    update: {},
    create: {
      name: "Demo Agency",
      slug: "demo-agency",
      plan: "PRO",
      billingEmail: "admin@reachpilot.dev",
    },
  });

  // Create membership
  await prisma.membership.upsert({
    where: { userId_orgId: { userId: user.id, orgId: org.id } },
    update: {},
    create: {
      userId: user.id,
      orgId: org.id,
      role: "OWNER",
      acceptedAt: new Date(),
    },
  });

  console.log("Seed complete:", { user: user.email, org: org.slug });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Add seed config to package.json**

Add to `packages/db/package.json` under the top level:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 3: Run seed**

Run: `cd packages/db && npx prisma db seed`
Expected: "Seed complete: { user: 'admin@reachpilot.dev', org: 'demo-agency' }"

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/seed.ts packages/db/package.json
git commit -m "feat: add database seed script with test user and demo organization"
```

---

### Task 18: Dockerfile & Production Docker Compose

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.prod.yml`

- [ ] **Step 1: Create multi-stage Dockerfile**

Create `Dockerfile`:

```dockerfile
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

RUN pnpm install --frozen-lockfile

# ── Builder ───────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

RUN corepack enable pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY . .

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

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]

# ── Worker Runner ─────────────────────────────────────────────────────
FROM base AS worker
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

CMD ["node", "apps/worker/dist/index.js"]
```

- [ ] **Step 2: Create production Docker Compose**

Create `docker-compose.prod.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: reachpilot-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: reachpilot
      POSTGRES_USER: reachpilot
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Set DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U reachpilot"]
      interval: 5s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1536M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  redis:
    image: redis:7-alpine
    container_name: reachpilot-redis
    restart: unless-stopped
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 256M

  web:
    build:
      context: .
      dockerfile: Dockerfile
      target: web
    container_name: reachpilot-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file: .env
    environment:
      DATABASE_URL: postgresql://reachpilot:${DB_PASSWORD}@db:5432/reachpilot
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 1G
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"

  worker:
    build:
      context: .
      dockerfile: Dockerfile
      target: worker
    container_name: reachpilot-worker
    restart: unless-stopped
    env_file: .env
    environment:
      DATABASE_URL: postgresql://reachpilot:${DB_PASSWORD}@db:5432/reachpilot
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: reachpilot-tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${CF_TUNNEL_TOKEN:-}
    depends_on:
      - web
    profiles:
      - tunnel
    deploy:
      resources:
        limits:
          memory: 128M

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 3: Commit**

```bash
git add Dockerfile docker-compose.prod.yml
git commit -m "feat: add multi-stage Dockerfile and production Docker Compose"
```

---

### Task 19: Validator Tests

**Files:**
- Create: `packages/shared/__tests__/validators.test.ts`

- [ ] **Step 1: Write validator tests**

Create `packages/shared/__tests__/validators.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createOrgSchema, inviteMemberSchema, updateMemberRoleSchema } from "../src/validators";

describe("createOrgSchema", () => {
  it("should accept valid org data", () => {
    const result = createOrgSchema.safeParse({ name: "My Agency", slug: "my-agency" });
    expect(result.success).toBe(true);
  });

  it("should reject short name", () => {
    const result = createOrgSchema.safeParse({ name: "A", slug: "my-agency" });
    expect(result.success).toBe(false);
  });

  it("should reject slug with uppercase", () => {
    const result = createOrgSchema.safeParse({ name: "My Agency", slug: "My-Agency" });
    expect(result.success).toBe(false);
  });

  it("should reject slug with spaces", () => {
    const result = createOrgSchema.safeParse({ name: "My Agency", slug: "my agency" });
    expect(result.success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("should accept valid invitation", () => {
    const result = inviteMemberSchema.safeParse({ email: "user@example.com", role: "EDITOR" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = inviteMemberSchema.safeParse({ email: "not-email", role: "EDITOR" });
    expect(result.success).toBe(false);
  });

  it("should reject OWNER role in invitations", () => {
    const result = inviteMemberSchema.safeParse({ email: "user@example.com", role: "OWNER" });
    expect(result.success).toBe(false);
  });
});

describe("updateMemberRoleSchema", () => {
  it("should accept valid role update", () => {
    const result = updateMemberRoleSchema.safeParse({ role: "ADMIN" });
    expect(result.success).toBe(true);
  });

  it("should reject OWNER role", () => {
    const result = updateMemberRoleSchema.safeParse({ role: "OWNER" });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run all tests**

Run: `cd packages/shared && pnpm test`
Expected: All tests pass (encryption + plan-limits + validators)

- [ ] **Step 3: Commit**

```bash
git add packages/shared/__tests__/validators.test.ts
git commit -m "test: add validator tests for org creation, invitations, and role updates"
```

---

### Task 20: (Merged into Task 24)

---

### Task 21: Platform SDK Package Skeleton

**Files:**
- Create: `packages/platform-sdk/package.json`
- Create: `packages/platform-sdk/tsconfig.json`
- Create: `packages/platform-sdk/src/index.ts`

- [ ] **Step 1: Create packages/platform-sdk/package.json**

```json
{
  "name": "@reachpilot/platform-sdk",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest watch"
  },
  "dependencies": {
    "@reachpilot/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create packages/platform-sdk/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create packages/platform-sdk/src/index.ts**

```typescript
// Platform SDK — implemented in Phase 2
// Will export: PlatformClient, platform-specific adapters, token refresh logic
export {};
```

- [ ] **Step 4: Commit**

```bash
git add packages/platform-sdk
git commit -m "feat: add platform-sdk package skeleton for Phase 2"
```

---

### Task 22: Organization Switching API

**Files:**
- Create: `apps/web/src/app/api/organizations/switch/route.ts`

- [ ] **Step 1: Create org switch route**

Create `apps/web/src/app/api/organizations/switch/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@reachpilot/db";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";

// POST /api/organizations/switch — switch active organization
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED", statusCode: 401 }, { status: 401 });
  }

  const { orgId } = await req.json();
  if (!orgId) {
    return NextResponse.json({ error: "orgId required", code: "VALIDATION_ERROR", statusCode: 400 }, { status: 400 });
  }

  // Verify user is a member of this org
  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: session.user.id, orgId } },
    include: { organization: { select: { deletedAt: true } } },
  });

  if (!membership || membership.organization.deletedAt) {
    return NextResponse.json({ error: "Not a member of this organization", code: "FORBIDDEN", statusCode: 403 }, { status: 403 });
  }

  // Update the JWT by encoding a new token with the org context.
  // NextAuth v5 uses the session callback to populate the session from JWT.
  // We set a cookie to signal the desired org, which the JWT callback reads.
  const cookieStore = await cookies();
  cookieStore.set("reachpilot-org-id", orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return NextResponse.json({
    orgId: membership.orgId,
    role: membership.role,
    orgName: membership.organization,
  });
}
```

- [ ] **Step 2: Update NextAuth JWT callback to read org cookie**

In `apps/web/src/lib/auth.ts`, update the `jwt` callback to check for the org cookie:

```typescript
// Inside the jwt callback, replace the org loading logic with:
async jwt({ token, user, trigger }) {
  if (user) {
    token.userId = user.id;
  }

  // Check for org switch cookie
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const orgCookie = cookieStore.get("reachpilot-org-id");

  if (orgCookie?.value) {
    const membership = await prisma.membership.findUnique({
      where: { userId_orgId: { userId: token.userId as string, orgId: orgCookie.value } },
    });
    if (membership) {
      token.currentOrgId = membership.orgId;
      token.currentRole = membership.role;
      return token;
    }
  }

  // Fallback: auto-select if single org
  if (token.userId && !token.currentOrgId) {
    const memberships = await prisma.membership.findMany({
      where: { userId: token.userId as string },
      orderBy: { createdAt: "asc" },
    });
    if (memberships.length === 1) {
      token.currentOrgId = memberships[0].orgId;
      token.currentRole = memberships[0].role;
    }
  }

  return token;
},
```

- [ ] **Step 3: Update org picker to use the switch API**

Update `apps/web/src/app/(dashboard)/org-picker/page.tsx` — replace the non-functional buttons with forms that call the switch API:

```tsx
// Replace the button in the map with:
<form action={async () => {
  "use server";
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set("reachpilot-org-id", m.organization.id, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/dashboard");
}} key={m.organization.id}>
  <button type="submit" className="w-full text-left border rounded-lg p-4 hover:bg-gray-50">
    <div className="font-medium">{m.organization.name}</div>
    <div className="text-sm text-gray-500">{m.organization.plan} &middot; {m.role}</div>
  </button>
</form>
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/organizations/switch apps/web/src/lib/auth.ts apps/web/src/app/\(dashboard\)/org-picker
git commit -m "feat: add organization switching via cookie + server action"
```

---

### Task 23: Auth Middleware Tests

**Files:**
- Create: `apps/web/src/__tests__/auth-middleware.test.ts`

- [ ] **Step 1: Write auth middleware tests**

Create `apps/web/src/__tests__/auth-middleware.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ROLE_HIERARCHY } from "@reachpilot/shared";

// Test the role hierarchy logic directly (extracted from withRole)
function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 999;
  return userLevel >= requiredLevel;
}

describe("RBAC role hierarchy", () => {
  it("OWNER should have access to all roles", () => {
    expect(hasMinimumRole("OWNER", "VIEWER")).toBe(true);
    expect(hasMinimumRole("OWNER", "EDITOR")).toBe(true);
    expect(hasMinimumRole("OWNER", "ADMIN")).toBe(true);
    expect(hasMinimumRole("OWNER", "OWNER")).toBe(true);
  });

  it("ADMIN should have access to ADMIN, EDITOR, VIEWER", () => {
    expect(hasMinimumRole("ADMIN", "VIEWER")).toBe(true);
    expect(hasMinimumRole("ADMIN", "EDITOR")).toBe(true);
    expect(hasMinimumRole("ADMIN", "ADMIN")).toBe(true);
    expect(hasMinimumRole("ADMIN", "OWNER")).toBe(false);
  });

  it("EDITOR should have access to EDITOR and VIEWER", () => {
    expect(hasMinimumRole("EDITOR", "VIEWER")).toBe(true);
    expect(hasMinimumRole("EDITOR", "EDITOR")).toBe(true);
    expect(hasMinimumRole("EDITOR", "ADMIN")).toBe(false);
    expect(hasMinimumRole("EDITOR", "OWNER")).toBe(false);
  });

  it("VIEWER should only have VIEWER access", () => {
    expect(hasMinimumRole("VIEWER", "VIEWER")).toBe(true);
    expect(hasMinimumRole("VIEWER", "EDITOR")).toBe(false);
    expect(hasMinimumRole("VIEWER", "ADMIN")).toBe(false);
    expect(hasMinimumRole("VIEWER", "OWNER")).toBe(false);
  });

  it("unknown role should have no access", () => {
    expect(hasMinimumRole("UNKNOWN", "VIEWER")).toBe(false);
  });
});
```

- [ ] **Step 2: Add vitest config for web app**

Create `apps/web/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Run tests**

Run: `cd apps/web && pnpm test`
Expected: All RBAC tests pass

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/__tests__/auth-middleware.test.ts apps/web/vitest.config.ts
git commit -m "test: add RBAC role hierarchy tests for auth middleware"
```

---

### Task 24: Final Integration Verification (updated)

This replaces Task 20's final verification with the additional packages.

- [ ] **Step 1: Install all dependencies from root**

Run: `pnpm install`
Expected: All workspace packages (db, shared, ui, platform-sdk, web, worker) resolve

- [ ] **Step 2: Run all tests from root**

Run: `pnpm test`
Expected: All tests pass (encryption, plan-limits, validators, RBAC)

- [ ] **Step 3: Verify Docker + DB + Dev server**

Run: `docker compose up -d && cd packages/db && npx prisma migrate deploy && npx prisma db seed && cd ../../apps/web && pnpm dev`

Verify:
- `GET http://localhost:3000` → landing page
- `GET http://localhost:3000/api/health` → `{"status":"ok"}`
- `GET http://localhost:3000/api/health/db` → `{"status":"ok"}`
- `GET http://localhost:3000/api/health/redis` → `{"status":"ok"}`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Phase 1 Foundation complete — monorepo, auth, RBAC, billing, worker"
```

---

## Summary

**24 tasks, ~120 steps.** After completion, Phase 1 delivers:

- Turborepo monorepo with 2 apps + 4 packages (including platform-sdk skeleton)
- Full Prisma schema (11 models, all enums, indexes, relations)
- Docker Compose for local dev (PostgreSQL + Redis)
- NextAuth.js v5 with Google OAuth + magic link
- RBAC middleware (withAuth, withRole) with role hierarchy
- Organization CRUD with audit logging
- Team invitations with plan-gated limits
- Stripe billing (checkout sessions, webhook handling, plan enforcement)
- AES-256-GCM encryption module with tests
- PlanLimitService with tests
- Zod validators with tests
- BullMQ worker skeleton with 8 queue definitions + scheduled jobs
- Health check endpoints (app, db, redis)
- Multi-stage Dockerfile + production Docker Compose
- Dashboard shell with sidebar navigation

**Next:** Phase 2 — Platform Connections (OAuth flows for all 9 platforms)
