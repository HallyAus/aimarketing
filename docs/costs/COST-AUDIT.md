# ReachPilot Cost & Usage Audit

> Generated 2026-04-03 as part of Audit 05.

---

## 1. Anthropic API Costs

### Model Usage

All AI endpoints use **claude-sonnet-4-6** (Sonnet-class pricing). No Opus calls detected.

| Endpoint | `max_tokens` | Estimated avg output | Notes |
|---|---|---|---|
| `generate-post` | 1024 | ~200 tokens | Per-platform post |
| `improve-post` | 1024 | ~200 tokens | Single rewrite |
| `generate-ideas` | 2048 | ~600 tokens | Campaign ideas list |
| `hashtags` | 2048 | ~500 tokens | JSON hashtag research |
| `translate` | 4096 | ~800 tokens | Multi-language JSON |
| `repurpose` | 4096 | ~1500 tokens | Multi-format rewrite |
| `carousel` | 4096 | ~800 tokens | Slide-by-slide content |
| `brand-voice` | 2048 | ~400 tokens | Voice extraction |
| `ab-variants` | 2048 | ~600 tokens | A/B copy variants |
| `competitor-analysis` | 4096 | ~1200 tokens | Competitor report |
| `competitor-match` | 2048 | ~600 tokens | Style matching |
| `drafts` | 2048 | ~400 tokens | Draft suggestions |
| `generate-image` | 1024 | ~200 tokens | Prompt generation |
| `image-gen` | 1024 | ~200 tokens | Image prompt |
| `keyword-scan` | 2048 | ~500 tokens | Keyword JSON |
| `story-template` | 2048 | ~400 tokens | Story frames |
| `trending` | 2048 | ~500 tokens | Trend analysis |
| `url-to-posts` | 4096 | ~1000 tokens | URL-to-posts |
| `video-script` | 2048 | ~600 tokens | Script generation |

### Pricing Assumptions (Sonnet-class, as of April 2026)

- Input: ~$3 / 1M tokens
- Output: ~$15 / 1M tokens
- Average request: ~500 input tokens, ~500 output tokens
- **Cost per AI request: ~$0.009** (input $0.0015 + output $0.0075)

### Monthly Cost Projections

| Scale | Active Users | AI Requests/User/Mo | Total Requests | Est. Cost |
|---|---|---|---|---|
| 100 users | 60 (60% DAU) | 15 | 900 | **$8/mo** |
| 1,000 users | 400 | 15 | 6,000 | **$54/mo** |
| 10,000 users | 3,000 | 15 | 45,000 | **$405/mo** |

### Optimizations Implemented

- [x] All endpoints already use Sonnet (not Opus)
- [x] `max_tokens` set per use case (256--4096 range)
- [x] Tier-based usage limits created in `apps/web/src/lib/usage-limits.ts`
- [ ] Token counting in structured logger (future work)
- [ ] Redis caching for common AI requests (future work)
- [ ] System prompt trimming audit (future work)

---

## 2. Vercel Costs

### Serverless Functions

- **19 AI API routes** (each invocation is a serverless call)
- Dashboard pages use server-side rendering
- Marketing pages are statically renderable

### Projections

| Scale | Estimated Invocations/Mo | Plan | Est. Cost |
|---|---|---|---|
| 100 users | ~50K | Pro ($20/mo) | **$20/mo** |
| 1,000 users | ~500K | Pro | **$20/mo** |
| 10,000 users | ~5M | Pro + overages | **$50--80/mo** |

### Optimizations

- [x] Marketing pages can use static generation / ISR
- [x] `next/font` used for self-hosted fonts (no external CDN)
- [x] `@vercel/analytics` lightweight
- [ ] Move dashboard pages to client-side data fetching (future)
- [ ] Edge runtime for lightweight routes (future)

---

## 3. Database Costs (PostgreSQL)

### Storage Projections

| Data Type | Per-User/Year | Notes |
|---|---|---|
| Posts | ~1.2 MB | ~50 posts/mo x 2 KB |
| Historical ingestion | ~1.5 MB | One-time per account |
| Audit logs | ~600 KB | ~100 events/mo |
| Usage records | ~72 KB | ~30 records/mo |
| **Total** | **~3.4 MB** | |

| Scale | Active Data | Hosting | Est. Cost |
|---|---|---|---|
| 100 users | ~340 MB | Small managed PG | **$15/mo** |
| 1,000 users | ~3.4 GB | Medium PG | **$30/mo** |
| 10,000 users | ~34 GB | Standard PG | **$80/mo** |

### Optimizations

- [ ] Audit log archival (>90 days to cold storage)
- [ ] Soft-delete purge (>30 days)
- [ ] Metric snapshot aggregation (daily -> weekly after 90d)

---

## 4. Redis Costs

### Memory Projections

| Data Type | Per Active User | Notes |
|---|---|---|
| Cache entries | ~25 KB | ~50 keys x 500B |
| Rate limiting | ~2 KB | Sorted sets |
| BullMQ jobs | ~100 KB total | Shared |
| Feature flags | ~10 KB total | Shared |

| Scale | Active Users (20% DAU) | Memory | Plan | Est. Cost |
|---|---|---|---|---|
| 100 users | 20 | ~1 MB | Free tier (Upstash) | **$0/mo** |
| 1,000 users | 200 | ~6 MB | Pro (Upstash) | **$10/mo** |
| 10,000 users | 2,000 | ~55 MB | Standard | **$25/mo** |

### Optimizations

- [ ] Set `maxmemory-policy: allkeys-lru`
- [ ] TTLs on every cache key
- [ ] Clean completed BullMQ jobs aggressively

---

## 5. Social Platform API Quotas

| Platform | Endpoint | Limit | Per | Bottleneck at Scale |
|---|---|---|---|---|
| Facebook | POST /feed | 25 | 24h per page | 1K users: fine |
| Instagram | POST /media | 25 | 24h per account | 1K users: fine |
| TikTok | POST /video | 20 | 24h per account | 1K users: fine |
| Twitter/X | POST /tweets | 300 | 3h per app | **Shared limit -- first bottleneck** |
| YouTube | Upload | 10K quota units | day per project | **~6 uploads/day** |
| LinkedIn | POST /ugcPosts | 100 | day per member | Fine |
| Pinterest | POST /pins | 50 | 1h per token | Fine |
| Snapchat | Ads API | 100 | min per token | Fine |

### Bottleneck Analysis

At 1,000 users averaging 3 posts/day per connected account:
- **Twitter/X** is the first bottleneck (shared 300/3h app limit)
- **YouTube** caps at ~6 video uploads/day across all users
- Solution: BullMQ publishing queue with per-platform rate limiter

---

## 6. Usage Limits (Implemented)

File: `apps/web/src/lib/usage-limits.ts`

| Limit | FREE | PRO | AGENCY |
|---|---|---|---|
| AI generations/month | 20 | 200 | Unlimited |
| Posts/month | 30 | Unlimited | Unlimited |
| Connected platforms | 3 | 9 | Unlimited |
| Team members | 1 | 5 | Unlimited |
| AI requests/hour (burst) | 10 | 60 | 30 |

Usage is tracked in the existing `UsageRecord` table with the `AI_TOKENS_USED` metric. AI endpoints call `enforceAiGenerationLimit()` before making Anthropic API calls and `incrementUsage()` after.

---

## 7. Cost Summary

| Cost Center | 100 Users | 1,000 Users | 10,000 Users |
|---|---|---|---|
| Vercel (Pro) | $20/mo | $20/mo | $50--80/mo |
| Anthropic API | $8/mo | $54/mo | $405/mo |
| PostgreSQL | $15/mo | $30/mo | $80/mo |
| Redis | $0/mo | $10/mo | $25/mo |
| **Total** | **$43/mo** | **$114/mo** | **$560--590/mo** |
| Revenue (est.) | $500/mo | $15K/mo | $200K/mo |
| **Margin** | **~91%** | **~99%** | **~99.7%** |

### Revenue Assumptions

- 100 users: 80 Free, 15 Pro ($49), 5 Agency ($299) = $2,230/mo (conservative $500 with churn)
- 1,000 users: 700 Free, 230 Pro, 70 Agency = $32,000/mo (conservative $15K)
- 10,000 users: 7,000 Free, 2,300 Pro, 700 Agency = $322,000/mo (conservative $200K)

**Conclusion:** ReachPilot's cost structure scales favorably. Anthropic API is the largest variable cost but stays under 1% of revenue at scale thanks to tier-based usage limits.

---

## Remaining Work

1. Add token counting to the structured logger (`{ inputTokens, outputTokens, model, cost }`)
2. Redis caching for top 20 common AI request patterns (60-minute TTL)
3. Trim system prompts across all AI endpoints
4. BullMQ per-platform rate limiter for social publishing
5. `@next/bundle-analyzer` audit for client bundle optimization
6. Connection pool sizing verification for serverless
