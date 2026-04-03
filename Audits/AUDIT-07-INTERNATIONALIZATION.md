# AdPilot — Audit 7: Internationalization (i18n) Readiness

> **For use in Claude Code against the `HallyAus/aimarketing` repo**
> Run autonomously. Fix issues, commit, move on.

---

## CONTEXT

AdPilot targets a global audience. Even launching English-only, the architecture must support future localization without a rewrite. This audit ensures dates, numbers, currencies, and strings are handled correctly for international users from day one.

**Output:** `docs/i18n/I18N-AUDIT.md`

---

## PHASE 1: STRING EXTRACTION

### 1.1 — Audit Hardcoded Strings
```bash
# Find JSX with hardcoded English text
grep -rn ">[A-Z][a-z]" src/components/ src/app/ --include="*.tsx" | grep -v "import\|export\|const\|type\|interface\|//" | head -50
```

- Flag every hardcoded English string in JSX (button labels, headings, descriptions, error messages, tooltips, placeholders)
- Assess scale: how many strings would need extraction?
- **Do NOT extract strings now** — just document the count and create a migration plan
- Create `src/lib/i18n/strings.ts` as a centralized string constants file for critical UI text (error messages, status labels, button labels). This is the lightweight first step before a full i18n library.

### 1.2 — i18n Architecture Plan
Document the recommended approach for future localization:
- Library: `next-intl` (best for App Router) or `i18next`
- File structure: `messages/en.json`, `messages/es.json`, etc.
- Routing: `/en/dashboard`, `/es/dashboard` (Next.js middleware-based)
- String key convention: `page.section.element` (e.g., `dashboard.metrics.postsThisMonth`)
- Pluralization rules
- Dynamic content (blog posts, announcements) — separate from UI strings

---

## PHASE 2: DATE & TIME FORMATTING

### 2.1 — Audit Current Formatting
```bash
grep -rn "toLocaleDateString\|toLocaleTimeString\|toISOString\|format(\|\.format(" src/ --include="*.ts" --include="*.tsx" | head -30
```

- Are dates formatted with user's locale? Or hardcoded US format ("MM/DD/YYYY")?
- Is `Intl.DateTimeFormat` used? Or raw string manipulation?

### 2.2 — Standardize
Create `src/lib/i18n/format.ts`:

```typescript
export function formatDate(date: Date, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(date);
}

export function formatTime(date: Date, locale: string = 'en-US', use24h?: boolean): string {
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: use24h === undefined ? undefined : !use24h,
  }).format(date);
}

export function formatDateTime(date: Date, locale: string = 'en-US', timezone?: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(date);
}

export function formatRelative(date: Date, locale: string = 'en-US'): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffMs = date.getTime() - Date.now();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);
  
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day');
  return formatDate(date, locale);
}
```

Replace ALL date formatting in the codebase with these utilities. Pass `locale` from the user's preference (stored in User model).

---

## PHASE 3: NUMBER & CURRENCY FORMATTING

### 3.1 — Numbers
```typescript
export function formatNumber(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatCompact(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatPercent(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value);
}
```

### 3.2 — Currency
Pricing page currently shows USD. For i18n readiness:
```typescript
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
```
- Pricing page: use `formatCurrency(49, 'USD')` not hardcoded "$49"
- Invoice displays: use the currency from the Stripe invoice
- Dashboard metrics: use the org's default currency

---

## PHASE 4: RTL READINESS

- Audit CSS for hardcoded `left`/`right` values — replace with logical properties: `margin-inline-start`, `padding-inline-end`, `inset-inline-start`
- Audit `text-align: left` — replace with `text-align: start`
- Flexbox `flex-direction: row` is RTL-safe (auto-reverses). Absolute positioning is NOT.
- Check sidebar nav: would it work on the right side for RTL languages?
- **Don't implement RTL now** — just document the issues and ensure no new hardcoded directional CSS is added

---

## PHASE 5: 12h vs 24h TIME FORMAT

- Add `timeFormat` field to User model: `'auto' | '12h' | '24h'` (default: `'auto'`)
- `'auto'` detects from the user's locale using `Intl.DateTimeFormat().resolvedOptions().hour12`
- Expose in user settings as a toggle
- Apply everywhere times are displayed (content calendar, post scheduling, activity logs, admin dashboard)

---

## PHASE 6: EMAIL TEMPLATES

- Audit all email templates (welcome, password reset, invoice, subscription change, trial ending)
- Extract all text to a constants file
- Ensure date/time formatting in emails uses the recipient's timezone and locale
- Document: which emails would need translation for a new language?

---

## EXECUTION RULES

1. **Do NOT add a full i18n library yet.** This audit prepares the architecture.
2. **Do** create the formatting utilities and replace all hardcoded formatting.
3. **Do** extract critical strings to a constants file.
4. Commit with `i18n:` prefix.
5. Run `npm run build` after every phase.

---

☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)
🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.

*Generated for Daniel Hall — AdPilot / Agentic Consciousness — April 2026*
