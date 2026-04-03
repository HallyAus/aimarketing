# AdPilot — Audit 4: Error Handling & Resilience

> **For use in Claude Code against the `HallyAus/aimarketing` repo**
> Run autonomously. Fix issues, commit, move on.

---

## CONTEXT

In production, everything fails. Platform APIs return 500s, Stripe has outages, Redis connections drop, BullMQ workers crash, and the Anthropic API hits rate limits. This audit ensures AdPilot degrades gracefully — never explodes.

**Output:** `docs/resilience/RESILIENCE-AUDIT.md`

---

## PHASE 1: ERROR BOUNDARIES & LOADING STATES

### 1.1 — Error Boundaries

For EVERY route segment in `src/app/`, verify:

```bash
find src/app -name "page.tsx" -o -name "page.ts" | while read page; do
  dir=$(dirname "$page")
  if [ ! -f "$dir/error.tsx" ]; then
    echo "MISSING error.tsx: $dir"
  fi
done
```

- Create `error.tsx` for every route segment that fetches data
- Root `src/app/error.tsx` catches everything else
- Error boundaries must: show a user-friendly message, offer a "Try Again" button (calls `reset()`), log the error to the structured logger, never show stack traces or internal details
- Admin routes: error boundaries can show more detail (error code, timestamp)

### 1.2 — Loading States

```bash
find src/app -name "page.tsx" -o -name "page.ts" | while read page; do
  dir=$(dirname "$page")
  if [ ! -f "$dir/loading.tsx" ]; then
    echo "MISSING loading.tsx: $dir"
  fi
done
```

- Create `loading.tsx` skeleton for every route with data fetching
- Skeletons must match the layout of the loaded content (prevent layout shift)
- Use Suspense boundaries for independent data sections within a page

### 1.3 — Not Found Pages

```bash
find src/app -type d -name "[*" | while read dir; do
  if [ ! -f "$dir/not-found.tsx" ]; then
    echo "MISSING not-found.tsx: $dir"
  fi
done
```

- Every dynamic `[id]` route needs a `not-found.tsx`
- Must be branded (not the default Next.js 404), helpful ("This page doesn't exist. Here are some things you can do...")

---

## PHASE 2: EXTERNAL SERVICE FAILURES

For every external service the app calls, implement failure handling:

### 2.1 — Social Platform APIs (Facebook, Instagram, TikTok, etc.)

**Failure modes:** 500 errors, rate limits (429), token expiry (401), API changes (breaking response format), network timeouts, malformed JSON.

**Required handling:**
```typescript
async function callPlatformWithResilience(
  accountId: string,
  platform: Platform,
  apiCall: () => Promise<Response>,
  options: { timeout?: number; retries?: number } = {}
): Promise<Response> {
  const { timeout = 10000, retries = 2 } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      
      const response = await apiCall();
      clearTimeout(timer);
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        await sleep(retryAfter * 1000);
        continue;
      }
      
      if (response.status === 401) {
        await refreshWithLock(accountId);
        continue; // retry with new token
      }
      
      if (response.status >= 500) {
        if (attempt < retries) {
          await sleep(Math.pow(2, attempt) * 1000); // exponential backoff
          continue;
        }
      }
      
      return response;
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.warn('Platform API timeout', { platform, accountId, attempt });
      }
      if (attempt === retries) throw err;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 2.2 — Stripe API

- Payment failures: update org status to `PAST_DUE`, show banner to the user, notify admin
- Webhook delivery failures: Stripe retries for up to 3 days — ensure idempotent processing
- API outage: billing pages show "Billing information temporarily unavailable" with cached last-known state
- Subscription read failures: fall back to cached tier in Redis, never block the entire app

### 2.3 — Anthropic API (AI Content Generation)

- Rate limits: queue requests, show "AI is busy — try again in a moment"
- API outage: disable AI features gracefully, show "AI Content Studio is temporarily unavailable. You can still create posts manually."
- Token limit exceeded: catch `overloaded_error`, fall back to smaller model or queue for later
- Malformed response: validate response shape before using, fall back to error state
- **Never block the entire dashboard because AI is down**

### 2.4 — Redis

- Connection failure: all cache reads return `null` (cache miss) — app falls back to database
- Connection failure: rate limiting falls back to in-memory limiter
- Connection failure: BullMQ jobs pause — show warning in admin but don't crash the app
- Reconnection: automatic with exponential backoff (already in the Redis singleton)
- **Redis is a performance optimization, not a hard dependency.** The app MUST work without it.

### 2.5 — Database (PostgreSQL)

- Connection pool exhausted: return 503 with "Service temporarily busy, please try again"
- Connection timeout: retry once, then 503
- Migration drift: `prisma migrate status` check in health endpoint
- **Database is a hard dependency — if it's down, the app is down. But error messages must be graceful.**

---

## PHASE 3: BULLMQ RESILIENCE

### 3.1 — Job Failure Handling

For every worker, verify:
- Failed jobs retry with exponential backoff
- After max retries, jobs move to "failed" state (not silently dropped)
- Failed jobs are visible in the admin dashboard
- Post-publishing failures update the post status to `FAILED` with an error message

### 3.2 — Worker Crash Recovery

- Workers must register `SIGTERM` and `SIGINT` handlers for graceful shutdown
- Active jobs should be returned to the queue (not lost) on crash
- Stale job detection: a maintenance cron checks for jobs stuck in `active` state for more than the timeout period and requeues them

### 3.3 — Queue Backpressure

- If the queue depth exceeds 10,000 jobs: log a warning, alert admin
- If the queue depth exceeds 50,000 jobs: pause accepting new jobs, return 503 to users with "Scheduling is temporarily delayed"
- Monitor queue health in `/api/admin/system/queues`

---

## PHASE 4: GRACEFUL DEGRADATION IN THE UI

### 4.1 — Feature-Level Degradation

Each dashboard section should fail independently:

```tsx
// GOOD: each section has its own error boundary
<main>
  <Suspense fallback={<MetricsSkeleton />}>
    <ErrorBoundary fallback={<MetricsUnavailable />}>
      <DashboardMetrics pageId={pageId} />
    </ErrorBoundary>
  </Suspense>
  
  <Suspense fallback={<CalendarSkeleton />}>
    <ErrorBoundary fallback={<CalendarUnavailable />}>
      <ContentCalendar pageId={pageId} />
    </ErrorBoundary>
  </Suspense>
  
  <Suspense fallback={<PostsSkeleton />}>
    <ErrorBoundary fallback={<PostsUnavailable />}>
      <RecentPosts pageId={pageId} />
    </ErrorBoundary>
  </Suspense>
</main>

// BAD: one error kills the whole page
<main>
  <DashboardMetrics pageId={pageId} />
  <ContentCalendar pageId={pageId} />
  <RecentPosts pageId={pageId} />
</main>
```

### 4.2 — Offline / Slow Connection

- Show stale cached data with a "Last updated X minutes ago" indicator rather than a blank screen
- Form submissions: disable the submit button and show a spinner, handle network errors with "Failed to save. Check your connection and try again."
- Never lose user input: if a post creation fails, preserve the draft in localStorage

---

## PHASE 5: HEALTH CHECK SYSTEM

### 5.1 — Deep Health Check

Expand `/api/health` to check every dependency:

```typescript
const checks = {
  database: await checkDatabase(),      // SELECT 1
  redis: await checkRedis(),            // PING
  queues: await checkQueues(),          // job counts
  stripe: await checkStripe(),          // lightweight API call
  anthropic: await checkAnthropic(),    // model list or similar
  platforms: {
    facebook: await checkPlatform('https://graph.facebook.com/v18.0/me'),
    // ... other platforms
  },
};
```

### 5.2 — Shallow Health Check

Create `/api/health/shallow` — returns 200 instantly with no external calls. Used by load balancers and uptime monitors.

---

## EXECUTION RULES

1. Fix every missing error boundary and loading state first — highest impact.
2. External service resilience: implement the wrapper functions, then refactor existing API calls to use them.
3. Commit with `fix:` or `feat:` prefix.
4. Run `npm run build` after every phase.

---

☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)
🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.

*Generated for Daniel Hall — AdPilot / Agentic Consciousness — April 2026*
