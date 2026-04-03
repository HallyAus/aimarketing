# ADR-001: Next.js 15 App Router

**Date:** 2026-03-15
**Status:** Accepted

## Context

AdPilot is a multi-tenant SaaS with complex per-page data scoping, authentication gates, nested layouts (marketing site, auth flows, dashboard, admin panel), and server-side data fetching requirements. We needed a full-stack React framework that supports:

- Server Components for zero-JS data fetching in dashboard views
- Nested layouts that persist state (e.g., sidebar, active page selector)
- Route groups to separate marketing, auth, dashboard, and admin concerns
- Streaming and Suspense for progressive loading of analytics widgets
- API routes colocated with the frontend for a monolithic deployment target (Vercel)

## Decision

Use **Next.js 15 with the App Router** as the primary web framework.

The app is organized into route groups:

- `(marketing)/` -- Public marketing pages (landing, pricing, blog)
- `(auth)/` -- Login, signup, password reset flows
- `(dashboard)/` -- Authenticated user application
- `admin/` -- Admin backend with separate layout
- `api/` -- 100+ API route handlers

## Consequences

**Benefits:**

- Server Components eliminate client-side data waterfalls for dashboard pages.
- Nested layouts allow the sidebar and page selector to persist across navigation without re-rendering.
- Route groups cleanly separate public and authenticated areas with different root layouts.
- Built-in middleware handles auth redirects and timezone cookie injection.
- Vercel deployment is zero-config.

**Trade-offs:**

- The App Router has a steeper learning curve than the Pages Router, particularly around server/client component boundaries.
- Some third-party libraries require `"use client"` wrappers.
- Build times are longer compared to the Pages Router due to RSC compilation.

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| **Pages Router** | No Server Components, no nested layouts, would require more client-side data fetching |
| **Remix** | Smaller ecosystem, fewer deployment targets, less mature at the time of decision |
| **SvelteKit** | Team has deeper React expertise; would require retraining |
| **Separate API + SPA** | Adds infrastructure complexity; two deployments instead of one |
