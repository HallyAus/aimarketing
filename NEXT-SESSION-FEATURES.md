# AdPilot — Next Session Feature Specs

## Feature 1: Sentiment Auto-Apply to Post Creation

**Problem:** Sentiment analysis generates great recommendations but they're siloed in the analytics page. Users have to manually remember and apply them when creating posts.

**Solution:** Surface sentiment recommendations at the point of creation.

### Implementation:
1. **Pre-flight sentiment check** — When user finishes writing/generating a post in AI Studio, run a quick sentiment analysis before scheduling. Show a small panel: "Sentiment: 72% Positive — 2 suggestions to improve" with expandable recommendations.
2. **Auto-improve button** — "Apply AI Suggestions" button that rewrites the post incorporating the sentiment recommendations (call Claude API to rewrite).
3. **Scheduled post review** — On the drafts page, add a "Sentiment Score" column. Posts below 60% positive get a yellow warning badge. Clicking opens improvement suggestions.
4. **Batch sentiment check** — On the drafts page, "Check Sentiment" button runs analysis on all pending drafts at once.

### API Changes:
- `POST /api/ai/sentiment-check` — accepts post content, returns score + recommendations (lightweight, single-post)
- Reuse existing sentiment analysis logic from `/api/analytics/sentiment/route.ts`

### UI Changes:
- Add sentiment score badge to post cards in drafts page
- Add "Improve Sentiment" button on post edit modal
- Add pre-publish sentiment check in the scheduling flow

---

## Feature 2: Cache AI-Generated Insights

**Problem:** Every time a user visits sentiment, audience, best-times, or benchmarking pages, a fresh AI call is made. This is slow, expensive, and the data doesn't change that frequently.

**Solution:** Save AI-generated insights to the database, show as static content, with "Regenerate" button that's rate-limited.

### Implementation:

1. **New model** — `CachedInsight`:
```prisma
model CachedInsight {
  id        String   @id @default(cuid())
  pageId    String
  orgId     String
  type      String   // "sentiment" | "audience" | "best-times" | "benchmarking" | "trending"
  data      Json     // the full AI response
  generatedAt DateTime
  expiresAt DateTime // auto-expire after 7 days
  createdAt DateTime @default(now())

  page Page @relation(fields: [pageId], references: [id], onDelete: Cascade)

  @@unique([pageId, type])
  @@index([pageId, type])
  @@index([expiresAt])
}
```

2. **Cache-first pattern** for each analytics page:
```typescript
// 1. Check cache
const cached = await prisma.cachedInsight.findUnique({
  where: { pageId_type: { pageId, type: "sentiment" } },
});
if (cached && cached.expiresAt > new Date()) {
  return cached.data; // serve from cache
}
// 2. Generate fresh (expensive AI call)
const fresh = await generateSentimentAnalysis(pageId);
// 3. Save to cache
await prisma.cachedInsight.upsert({
  where: { pageId_type: { pageId, type: "sentiment" } },
  update: { data: fresh, generatedAt: new Date(), expiresAt: addDays(7) },
  create: { pageId, orgId, type: "sentiment", data: fresh, generatedAt: new Date(), expiresAt: addDays(7) },
});
return fresh;
```

3. **UI changes per analytics page:**
- Show "Last analyzed: 2 hours ago" timestamp
- "Regenerate" button (rate limited: 1 per hour per page per type)
- Loading spinner only on first generation or manual regenerate
- Stale data shown with "Data may be outdated" badge after 7 days

### Pages to update:
- `/analytics/sentiment` — cache sentiment scores + recommendations
- `/analytics/audience` — cache audience demographics
- `/analytics/best-times` — cache optimal posting times
- `/analytics/benchmarking` — cache competitor benchmarks
- `/ai/trending` — cache trending topics (expire after 24h, not 7d)

### Rate limiting:
- Max 1 regeneration per hour per insight type per page
- Use the existing `UsageRecord` model or a simple timestamp check on `generatedAt`

---

## Feature 3: Other Quick Wins

- **Image generator not working properly** — The Sharp-based SVG generation creates text-on-gradient images. For actual AI image generation (like the TikTok flat illustration style), would need DALL-E or Stability AI integration. Current implementation is a styled text card generator, not a true AI image generator. Consider adding DALL-E 3 ($0.04/image) or Stability AI.

- **Resend emails not sending** — Check Vercel logs after clicking "Resend Verification" to see if RESEND_API_KEY is being detected. The dynamic import was added but may need the `resend` package in production dependencies (not just devDependencies).

- **Dashboard width** — Already fixed (removed max-w-7xl), deployed. Verify on live site.

---

*Created April 3, 2026 — for next Claude Code session*
