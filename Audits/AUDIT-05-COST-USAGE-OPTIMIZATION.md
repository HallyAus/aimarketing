# ReachPilot — Audit 5: Cost & Usage Optimization

> **For use in Claude Code against the `HallyAus/aimarketing` repo**
> Run autonomously. Analyze, optimize, document, commit.

---

## CONTEXT

SaaS margins die when costs aren't controlled. ReachPilot pays for: Vercel compute, Anthropic API tokens, PostgreSQL hosting, Redis, and social platform API quotas. This audit maps every cost center, projects costs at scale, and implements optimizations.

**Output:** `docs/costs/COST-AUDIT.md` with projections at 100 / 1,000 / 10,000 users.

---

## PHASE 1: ANTHROPIC API COSTS

### 1.1 — Token Usage Audit
```bash
grep -rn "anthropic\|claude\|api.anthropic\|/v1/messages" src/ --include="*.ts" --include="*.tsx" | head -30
```

For every Anthropic API call:
- What model is used? (claude-sonnet-4-20250514 vs opus — pricing differs 5x)
- What's the system prompt token count? (estimate: 4 chars ≈ 1 token)
- Is conversation history trimmed? (max messages, max tokens per request)
- Is `max_tokens` set conservatively? (don't set 4096 if responses average 200 tokens)
- Are common responses cached? (FAQ-style questions about the platform — cache in Redis)

### 1.2 — Optimizations
- Use the cheapest sufficient model (Sonnet for content generation, not Opus)
- Trim system prompts: every unnecessary word costs money at scale
- Cache top 20 common AI requests in Redis (60-minute TTL)
- Set `max_tokens` per use case: content generation = 1024, post improvement = 512, hashtag suggestions = 256
- Add token counting to the structured logger: `{ inputTokens, outputTokens, model, cost }`
- Project monthly costs: `(avg_input_tokens × input_price + avg_output_tokens × output_price) × requests_per_user × users`

### 1.3 — Usage Limits
- FREE tier: 20 AI generations per month per org
- PRO tier: 200 AI generations per month
- AGENCY tier: unlimited (but rate-limited to 30/hour)
- Track usage in `UsageRecord` table, enforce in API route

---

## PHASE 2: VERCEL COSTS

### 2.1 — Serverless Function Audit
- How many API routes exist? Each is a serverless function invocation.
- Are any routes doing unnecessary work on every request? (heavy DB queries that could be cached)
- Are static pages properly using ISR (Incremental Static Regeneration) or static generation?
- Is the middleware lightweight? (middleware runs on EVERY request — keep it minimal)

### 2.2 — Optimizations
- Move dashboard pages to client-side data fetching (SWR/React Query) to reduce serverless invocations
- ISR for marketing pages: `revalidate: 3600` (1 hour)
- Static generation for: about, contact, terms, privacy, security, careers pages
- Edge runtime for lightweight API routes (health checks, feature flags)
- Reduce cold starts: minimize dependencies in API routes, use dynamic imports for heavy libraries

### 2.3 — Bandwidth
- Verify Next.js Image optimization is active (not serving unoptimized images)
- Verify fonts use `next/font` (self-hosted, not external CDN calls)
- Check for oversized API responses (use `select` in Prisma, not full models)

---

## PHASE 3: DATABASE COSTS

### 3.1 — Query Volume
- Add request counting: how many Prisma queries per page load?
- Flag any page that makes 10+ queries
- Identify N+1 patterns (covered in DB performance audit — verify fixes are in place)

### 3.2 — Storage Projections
Per-user estimates:
- Posts: ~50/month × 12 months = 600 rows/year × 2KB avg = 1.2MB/user/year
- Historical posts (ingestion): ~500 posts × 3KB = 1.5MB one-time per account
- Audit logs: ~100 events/month × 500B = 600KB/user/year
- Usage records: ~30/month × 200B = 72KB/user/year
- **Total: ~3-4MB/user/year**
- At 10,000 users: ~35GB active data — well within standard PostgreSQL limits

### 3.3 — Optimizations
- Audit log archival: move logs >90 days to cold storage or delete
- Soft delete purge: hard-delete records soft-deleted >30 days ago
- Historical metric snapshots: aggregate daily data into weekly/monthly after 90 days
- Connection pooling: verify pool size matches Vercel's serverless model

---

## PHASE 4: REDIS COSTS

### 4.1 — Memory Projections
Estimate Redis memory at scale:
- Cache entries: ~50 keys per active user × 500B avg = 25KB/user
- Rate limiting: ~10 sorted sets per active user × 200B = 2KB/user
- BullMQ jobs: ~100 active/completed jobs × 1KB = 100KB total
- Feature flags: ~20 keys × 500B = 10KB total
- **At 10,000 users with 20% daily active: ~55MB** — fits in a small Redis instance

### 4.2 — Optimizations
- Set `maxmemory-policy: allkeys-lru` — Redis evicts least-recently-used keys when full
- TTLs on every key (no unbounded cache growth)
- Use Redis pipelining for batch operations
- Clean up completed BullMQ jobs aggressively: `removeOnComplete: { age: 86400, count: 500 }`
- If on Vercel: consider Upstash (HTTP-based, no persistent connections, pay-per-request)

---

## PHASE 5: SOCIAL PLATFORM API QUOTAS

### 5.1 — Rate Limit Mapping
Document the rate limit for every platform API endpoint used:

| Platform | Endpoint | Limit | Per | Notes |
|----------|----------|-------|-----|-------|
| Facebook | POST /feed | 25 | 24h per page | Publishing limit |
| Facebook | GET /posts | 200 | 1h per user token | Reading |
| Instagram | POST /media | 25 | 24h per account | Publishing limit |
| TikTok | POST /video | 20 | 24h per account | |
| Twitter | POST /tweets | 300 | 3h per app | Shared across all users |
| YouTube | Upload | 10,000 quota units | day per project | 1 upload = 1600 units |
| LinkedIn | POST /ugcPosts | 100 | day per member | |
| Pinterest | POST /pins | 50 | 1h per token | |
| Snapchat | Ads API | 100 | min per token | |

### 5.2 — Bottleneck Analysis
At 1,000 users with 5 connected accounts each, averaging 3 posts/day per account:
- 15,000 publish API calls per day
- Twitter (shared 300/3h limit) is the first bottleneck — need multiple app tokens or publishing queue
- YouTube (10,000 quota/day) limits to ~6 video uploads per day across all users
- LinkedIn (100/day per member) limits each user to ~100 posts/day (fine)

### 5.3 — Optimizations
- Queue publishing to respect per-platform rate limits (BullMQ rate limiter per platform)
- Batch read operations where possible (Facebook batch API)
- Cache platform read responses (follower counts, page info) — don't re-fetch every page load
- Apply for elevated API access: Facebook Marketing API, Twitter Elevated Access, YouTube audit

---

## PHASE 6: BUILD TIME OPTIMIZATION

### 6.1 — Analyze Build
```bash
time npm run build 2>&1 | tee build-analysis.log
```
- Total build time
- Largest pages (by build output size)
- Any pages that could be statically generated but aren't

### 6.2 — Optimizations
- Dynamic imports for heavy dependencies (Recharts, date-fns-tz, Stripe.js)
- Minimize barrel file imports (`import { X } from '@/components'` pulls everything)
- Tree-shake: ensure unused exports aren't bundled
- Check `@next/bundle-analyzer` output for unexpected large chunks

---

## PHASE 7: COST PROJECTION TABLE

Create a summary table in `docs/costs/COST-AUDIT.md`:

| Cost Center | 100 Users | 1,000 Users | 10,000 Users |
|-------------|-----------|-------------|--------------|
| Vercel (Pro) | $20/mo | $20/mo | $20/mo + overages |
| Anthropic API | $X/mo | $X/mo | $X/mo |
| PostgreSQL | $X/mo | $X/mo | $X/mo |
| Redis | $X/mo | $X/mo | $X/mo |
| Total | $X/mo | $X/mo | $X/mo |
| Revenue (est.) | $X/mo | $X/mo | $X/mo |
| Margin | X% | X% | X% |

Fill in real estimates based on the audit findings.

---

## EXECUTION RULES

1. Implement every optimization directly. Commit with `perf:` or `chore:` prefix.
2. Cost projections are estimates — document assumptions clearly.
3. Run `npm run build` after every change.

---

☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)
🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.

*Generated for Daniel Hall — ReachPilot / Agentic Consciousness — April 2026*
