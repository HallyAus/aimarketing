# ADR-002: Prisma + PostgreSQL

**Date:** 2026-03-15
**Status:** Accepted

## Context

AdPilot manages relational data across 27+ models with complex relationships (organizations, memberships, platform connections, pages, posts, campaigns, analytics snapshots, billing records). We needed:

- A relational database that handles JSON columns (audience config, raw platform payloads), array fields (scopes, media URLs, tags), and decimal precision for financial data.
- An ORM that provides type-safe queries, migration management, and works well in a TypeScript monorepo.
- A database engine suitable for self-hosted deployment on a Proxmox homelab.

## Decision

Use **PostgreSQL 16** as the primary database and **Prisma ORM v6** as the data access layer.

The schema lives in `packages/db/prisma/schema.prisma` and is shared across the web app and worker via the `@adpilot/db` package. Prisma Client is generated into `packages/db/generated/client`.

## Consequences

**Benefits:**

- Prisma's generated TypeScript types guarantee compile-time safety for all queries.
- Declarative schema makes it easy to understand the full data model in one file.
- Prisma Migrate produces SQL migration files that are version-controlled and reviewable.
- PostgreSQL natively supports `String[]`, `Json`, and `Decimal` types used extensively in the schema.
- PostgreSQL 16 runs efficiently on a Docker container with 512MB memory limit.

**Trade-offs:**

- Prisma adds a query engine binary (~15MB) to the deployment artifact.
- Complex aggregations sometimes require raw SQL via `prisma.$queryRaw`.
- Schema changes require running `prisma generate` before TypeScript picks up new types.

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| **Drizzle ORM** | Less mature migration tooling at the time; Prisma's schema-first approach better fits the team's workflow |
| **Kysely** | Query builder only, no schema management or migration system |
| **TypeORM** | Decorator-based API conflicts with the functional style used throughout the codebase |
| **MySQL** | Lacks native array types and has weaker JSON indexing compared to PostgreSQL |
| **MongoDB** | Relational data model (org -> members -> pages -> posts) is a poor fit for document stores |
