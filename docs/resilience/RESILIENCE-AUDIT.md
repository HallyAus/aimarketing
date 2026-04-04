# ReachPilot Resilience Audit

> Generated 2026-04-03

---

## 1. Error Boundaries

### Findings

| Route group | `error.tsx` before | `error.tsx` after |
|---|---|---|
| `src/app/error.tsx` (root) | Existed (minimal) | Enhanced with `useEffect` logging and digest support |
| `src/app/(dashboard)/error.tsx` | Missing | Created |
| `src/app/admin/error.tsx` | Missing | Created — shows error code, digest, and timestamp for admin debugging |
| `src/app/(auth)/error.tsx` | Missing | Created — includes "Back to Sign In" link |

All error boundaries:
- Use `"use client"` directive (required by Next.js).
- Log the error with `console.error` inside `useEffect`.
- Show a user-friendly message (no stack traces to end users).
- Offer a "Try Again" button that calls `reset()`.
- Use existing design system CSS variables (`--text-primary`, `--bg-secondary`, `--accent-red`, etc.).

---

## 2. Loading States

### Findings

| Route | `loading.tsx` before | `loading.tsx` after |
|---|---|---|
| `src/app/(dashboard)/loading.tsx` | Existed (generic skeleton) | Unchanged — serves as fallback for all dashboard sub-routes |
| `src/app/(dashboard)/dashboard/loading.tsx` | Missing | Created — metric cards + tabs + content rows skeleton |
| `src/app/(dashboard)/campaigns/loading.tsx` | Missing | Created — header with action button + campaign card list skeleton |
| `src/app/(dashboard)/analytics/loading.tsx` | Missing | Created — metric row + chart placeholder + table skeleton |
| `src/app/admin/loading.tsx` | Missing | Created — metric cards + admin table skeleton |

All skeletons use `animate-pulse` and match the general layout of their respective pages to minimize layout shift.

---

## 3. External Service Resilience

### Created: `src/lib/resilience.ts`

Three composable utilities for wrapping external service calls:

| Utility | Purpose |
|---|---|
| `withRetry(fn, maxRetries, backoffMs)` | Exponential backoff retry. Default: 3 retries, 500ms base backoff. |
| `withTimeout(fn, timeoutMs)` | Rejects with `TimeoutError` if the function exceeds the deadline. Default: 10s. |
| `withCircuitBreaker(fn, failureThreshold, resetTimeMs)` | Standard three-state circuit breaker (CLOSED, OPEN, HALF_OPEN). Default: 5 failures to trip, 30s reset window. |

Exported types: `TimeoutError`, `CircuitBreakerOpenError`, `CircuitState`.

Usage example:

```typescript
import { withRetry, withTimeout } from "@/lib/resilience";

const data = await withRetry(
  () => withTimeout(() => fetch(url).then(r => r.json()), 8000),
  2,
  1000,
);
```

---

## 4. Health Check Enhancement

### `GET /api/health`

Enhanced to run database and Redis checks in parallel via `Promise.all`:

| Check | Method | Failure mode |
|---|---|---|
| Database | `SELECT 1` with timing | `down` — returns 503 |
| Redis | `PING` with timing | `degraded` — returns 200 (Redis is optional) |

Response includes:
- `status`: overall health (`healthy`, `degraded`, `down`)
- `timestamp`: ISO 8601
- `uptime`: `process.uptime()` seconds
- `checks`: per-service `{ status, latencyMs, error? }`

Existing sub-routes (`/api/health/db`, `/api/health/redis`) left intact for targeted probes.

---

## 5. Recommendations for Future Work

1. **BullMQ resilience** — Add `SIGTERM`/`SIGINT` handlers to workers and stale job requeue cron (Phase 3 of audit spec).
2. **Feature-level Suspense boundaries** — Wrap independent dashboard sections (metrics, calendar, recent posts) in their own `<Suspense>` + `<ErrorBoundary>` so one failure does not blank the whole page.
3. **Not-found pages** — Add branded `not-found.tsx` to dynamic `[id]` route segments (`campaigns/[campaignId]`, `admin/users/[id]`, etc.).
4. **Platform API wrapper** — Compose `withRetry`, `withTimeout`, and `withCircuitBreaker` into a `callPlatformWithResilience` helper that also handles 429 rate-limit headers and 401 token refresh.
5. **Offline/slow connection** — Preserve form drafts in `localStorage` on submission failure.
