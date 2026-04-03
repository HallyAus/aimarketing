# ADR-007: Page-Scoped Architecture

**Date:** 2026-03-15
**Status:** Accepted

## Context

Marketing agencies manage multiple brands (Facebook pages, Instagram accounts, LinkedIn company pages, etc.) within a single organization. A "filtered global dashboard" approach (one view, filter by account) creates UX problems:

- Users accidentally post to the wrong account
- Analytics are confusing when aggregated across unrelated brands
- Campaign planning requires constant filter switching
- Brand voice settings and hashtag sets are meaningless without page context

## Decision

Adopt a **page-scoped architecture** where each connected social media page/account is a first-class entity (`Page` model) that scopes all content operations.

Key implementation:

- **Active Page Selection:** Users select their active page via a cookie (`adpilot-active-page`). The `getActivePageId()` helper in `apps/web/src/lib/active-page.ts` resolves this server-side.
- **Data Scoping:** The `pageWhere()` helper returns a Prisma `where` clause fragment. When a page is selected, all queries are filtered to that page. When "All Accounts" is selected, queries return org-wide data.
- **Page-Owned Models:** Posts, campaigns, brand voices, hashtag sets, content templates, RSS feeds, webhook rules, lead captures, performance reports, ingestion jobs, and historical data all belong to a specific page.
- **Organization as Container:** The Organization owns pages (through PlatformConnections) and handles billing, team membership, and plan limits.

Data flow:
```
Organization
  -> PlatformConnection (OAuth credentials)
    -> Page (individual social account)
      -> Posts, Campaigns, Analytics, BrandVoice, etc.
```

## Consequences

**Benefits:**

- Eliminates accidental cross-brand posting; the active page context is always explicit.
- Analytics dashboards show data for the selected page without manual filtering.
- Brand voice and hashtag sets are meaningful within their page context.
- Clean URL structure: `/dashboard/posts` always shows posts for the active page.
- "All Accounts" mode provides the aggregate view when needed for reporting.

**Trade-offs:**

- Users must switch page context when managing multiple brands (extra click).
- Some queries require joining through Page -> PlatformConnection -> Organization for access control checks.
- The "All Accounts" aggregation view requires careful handling of mixed-platform data.

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| **Global dashboard with filters** | Error-prone for agencies managing 10+ accounts; too easy to post to wrong account |
| **Separate workspace per brand** | Adds billing complexity; agencies want one subscription covering all brands |
| **Tab-based multi-account** | Browser tabs do not share state; page context via cookie is simpler and works across tabs |
