# ReachPilot — Token Optimization Audit

**Date:** 2026-04-04
**Status:** Phases 1-3 Complete

## Summary

All 26 Claude API call sites across 22 files now route through a centralized `callClaude()` function with automatic model routing, prompt caching, token logging, cost estimation, and request deduplication.

## Optimizations Applied

### Phase 1: Centralized Client + Model Routing

| Optimization | Impact |
|---|---|
| Haiku for simple tasks (hashtags, keywords, translate, sentiment) | **4-5x cheaper** per call |
| Right-sized max_tokens per feature | Prevents verbose output, signals brevity |
| Single callClaude() entry point | Enables all other optimizations |
| Token logging on every call | Enables cost monitoring |

**Haiku-routed features (4-5x cost reduction):**
- hashtag_suggestion: 256 max tokens
- keyword_scan: 512 max tokens
- translate: 1024 max tokens
- sentiment_check: 1024 max tokens

### Phase 2: System Prompt Optimization

System prompts are cached via Anthropic's prompt caching (see Phase 3). Key principles applied:
- Removed filler language ("You are an expert...", "Please provide...")
- Used structured shorthand instead of prose
- Platform-specific constraints inline (char limits, hashtag counts)
- Content memory injected at end (not cached — varies per request)

### Phase 3: Prompt Caching

**Implementation:** `cache_control: { type: "ephemeral" }` on all system prompt blocks.

When a system prompt is sent, it's cached by Anthropic for 5 minutes. Subsequent requests with the same system prompt pay only 10% of the input token cost for that portion.

**Expected cache hit rate:** 60-80% for features where users make multiple requests in a session (content generation, A/B variants, image generation).

**Cost math:**
- Without caching: 1000-token system prompt = $0.003 per call (Sonnet)
- With caching (80% hit rate): average $0.0009 per call = **70% reduction on system tokens**

### Phase 4: Request Deduplication

In-flight request deduplication prevents double-click waste. If the same feature + message prefix is already being processed, the duplicate request reuses the same API call instead of making a second one.

### Phase 5: Input Trimming

`trimInput()` helper available for cleaning user input before sending:
- Collapses excessive whitespace and newlines
- Trims leading/trailing whitespace
- Hard cap at 5000 characters

### Cost Estimation

Every API call logs estimated USD cost:
```
[ai:content_generation] model=claude-sonnet-4-6 in=450 out=200 cache_r=0 cache_w=450 cost=$0.0044 stop=end_turn
[ai:hashtag_suggestion] model=claude-haiku-4-5 in=300 out=50 cache_r=0 cache_w=0 cost=$0.0004 stop=end_turn
```

## Cost Model (per million tokens)

| Model | Input | Output | Cache Read | Cache Write |
|---|---|---|---|---|
| Claude Sonnet 4.6 | $3.00 | $15.00 | $0.30 | $3.75 |
| Claude Haiku 4.5 | $0.80 | $4.00 | $0.08 | $1.00 |

## Feature → Model Mapping

| Feature | Model | max_tokens | Est. tokens/call |
|---|---|---|---|
| hashtag_suggestion | Haiku | 256 | ~300 |
| keyword_scan | Haiku | 512 | ~600 |
| translate | Haiku | 1024 | ~800 |
| sentiment_check | Haiku | 1024 | ~500 |
| content_generation | Sonnet | 1024 | ~600 |
| content_improvement | Sonnet | 512 | ~400 |
| ab_variants | Sonnet | 1024 | ~800 |
| trending_topics | Sonnet | 2048 | ~1200 |
| brand_voice | Sonnet | 2048 | ~1000 |
| video_script | Sonnet | 2048 | ~1500 |
| image_gen | Sonnet | 16384 | ~8000 |
| carousel | Sonnet | 32000 | ~15000 |
| landing_page | Sonnet | 16384 | ~8000 |
| email_campaign | Sonnet | 8192 | ~4000 |
| analytics_* | Sonnet | 4096 | ~2000 |
| community_feed | Sonnet | 4096 | ~2000 |
| competitor_* | Sonnet | 4096 | ~2000 |

## Estimated Monthly Cost at Scale

**Assumptions:** 1000 active users, 5 AI calls/user/day average

| Scenario | Monthly Cost |
|---|---|
| Before optimization (all Sonnet, 4096 max, no caching) | ~$2,700 |
| After Phase 1 (Haiku routing + right-sized tokens) | ~$1,800 |
| After Phase 3 (+ prompt caching at 70% hit rate) | ~$1,100 |
| **Total estimated reduction** | **~60%** |

## Future Phases (Not Yet Implemented)

- **Redis application-level caching** for deterministic responses (hashtags, moderation)
- **Batch API** for non-urgent tasks (50% cost — content moderation, analytics)
- **Per-tier token budgets** enforced per org
- **Admin dashboard** with token usage charts and cost alerts
