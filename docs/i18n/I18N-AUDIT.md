# Internationalization (i18n) Audit

**Date:** 2026-04-03
**Scope:** Formatting utilities, string extraction readiness, architecture plan

---

## 1. Current State

AdPilot is English-only. Dates, numbers, and currencies are formatted inconsistently across the codebase -- some use `toLocaleDateString()`, others use raw string manipulation or hardcoded formats.

---

## 2. Formatting Utilities: ADDED

**File:** `apps/web/src/lib/i18n/formatters.ts`

All formatting now uses browser-native `Intl` APIs with US English (`en-US`) as the default locale. Functions accept an optional `locale` parameter for future localization.

| Function | Purpose | Example |
|---|---|---|
| `formatDate(date, locale?, options?)` | Short date | "Apr 3, 2026" |
| `formatTime(date, locale?, options?)` | Time only | "2:30 PM" |
| `formatDateTime(date, locale?, options?)` | Date + time | "Apr 3, 2026, 2:30 PM" |
| `formatRelativeDate(date, locale?)` | Relative time | "2 hours ago", "yesterday" |
| `formatNumber(num, locale?, options?)` | Grouped number | "1,234,567" |
| `formatCompact(num, locale?)` | Compact number | "1.5K", "2.3M" |
| `formatPercent(value, locale?)` | Percentage | "15.6%" |
| `formatCurrency(amount, currency, locale?)` | Currency | "$49.99" |

---

## 3. UI Strings Constants: ADDED

**File:** `apps/web/src/lib/i18n/strings.ts`

Centralizes common UI text into typed constant objects:

- `ACTIONS` -- button labels (Save, Cancel, Delete, Connect, etc.)
- `NAV` -- navigation labels
- `CONNECTION_STATUS` / `TOKEN_HEALTH` -- status display text
- `TOKEN_MESSAGES` -- dynamic messages for token health notifications
- `POST_STATUS` / `CAMPAIGN_STATUS` -- status labels
- `PLATFORM_NAMES` -- human-readable platform names
- `ERRORS` -- common error messages
- `EMPTY_STATES` -- empty state descriptions
- `CONFIRMATIONS` -- confirmation dialog text

---

## 4. Recommended i18n Architecture

### Library

**next-intl** is the recommended library for full localization. It integrates natively with the Next.js App Router, supports server components, and provides:

- Message-based string lookup
- ICU MessageFormat for pluralization and interpolation
- Middleware-based locale routing

### File structure

```
messages/
  en.json        # US English (default)
  es.json        # Spanish
  fr.json        # French
  de.json        # German
  ...
```

### Routing

Use Next.js middleware-based locale routing:

```
/en/dashboard
/es/dashboard
/fr/dashboard
```

With a `[locale]` dynamic segment in the app directory:

```
app/
  [locale]/
    (dashboard)/
      ...
```

### String key convention

Follow a hierarchical dot-notation:

```
dashboard.metrics.postsThisMonth
settings.connections.connectButton
errors.network
```

### Pluralization

Use ICU MessageFormat syntax:

```json
{
  "posts.count": "{count, plural, =0 {No posts} one {1 post} other {# posts}}"
}
```

### Dynamic content

Blog posts, announcements, and user-generated content are NOT covered by the i18n system. They should be handled separately with a CMS or content API that supports multiple languages.

---

## 5. Date/Time Formatting Audit

### Current usage patterns found

- `toLocaleDateString()` -- used in some components without explicit locale
- `new Date().toISOString()` -- used for API payloads (correct, should not be localized)
- Hardcoded date strings in a few places

### Recommendation

Replace all display-facing date formatting with `formatDate()`, `formatTime()`, and `formatRelativeDate()` from `apps/web/src/lib/i18n/formatters.ts`. Keep `toISOString()` for API payloads and database operations.

---

## 6. Number/Currency Formatting Audit

### Current patterns

- Hardcoded "$" in pricing displays
- Raw `.toFixed(2)` for decimal formatting

### Recommendation

Replace with `formatCurrency(amount, currency)` and `formatNumber(value)`. The currency code should come from the organization's settings or the Stripe invoice object.

---

## 7. RTL Readiness Assessment

Not yet audited in detail. Key areas to review before adding RTL languages (Arabic, Hebrew):

- Replace `margin-left`/`margin-right` with `margin-inline-start`/`margin-inline-end`
- Replace `text-align: left` with `text-align: start`
- Audit absolute-positioned elements (sidebar, dropdowns)
- Flexbox `row` direction auto-reverses in RTL -- no changes needed there

**No RTL support is being implemented now.** This section documents the preparation needed.

---

## 8. 12h vs 24h Time Format

The `formatTime()` utility respects the user's locale by default:
- `en-US` defaults to 12-hour (2:30 PM)
- `en-GB`, `de-DE`, etc. default to 24-hour (14:30)

**Future enhancement:** Add a `timeFormat` preference to the User model (`'auto' | '12h' | '24h'`) and pass corresponding `Intl.DateTimeFormatOptions` to the formatting functions.

---

## 9. Migration Plan

### Phase 1 (Done)
- Created formatting utilities with Intl APIs
- Created centralized string constants
- Documented architecture plan

### Phase 2 (Future)
- Install `next-intl`
- Extract hardcoded strings from all components into `messages/en.json`
- Add `[locale]` routing with middleware
- Add locale switcher UI

### Phase 3 (Future)
- Add first non-English locale
- Implement RTL support
- Add user locale/time format preferences to User model
