# ADR-006: Intl API + Per-User Timezone

**Date:** 2026-03-15
**Status:** Accepted

## Context

AdPilot is built in Australia and used by marketing teams worldwide. Scheduling posts at the right local time is a core feature. The system must:

- Store all timestamps in UTC for consistency
- Auto-detect the user's timezone on first visit
- Allow each user to set their preferred timezone
- Display times in the user's local timezone throughout the dashboard
- Calculate optimal posting windows across multiple audience timezones
- Handle DST transitions correctly

## Decision

Use the **built-in Intl API** for all timezone operations with a **per-user timezone** stored in the `User.timezone` field (IANA string, e.g., `"Australia/Sydney"`).

Implementation in `apps/web/src/lib/timezone.ts`:

- **Auto-detection:** `Intl.DateTimeFormat().resolvedOptions().timeZone` on the client, persisted via cookie (`adpilot-timezone`) and saved to the user record.
- **Storage:** All `DateTime` fields in Prisma are UTC. No timezone offsets stored in the database.
- **Display:** `formatInUserTimezone()` uses `Intl.DateTimeFormat` with the `timeZone` option for locale-aware formatting.
- **Scheduling:** `toUTC()` converts user-local schedule times to UTC before storage. `fromUTC()` converts back for display.
- **Optimal posting:** `getOptimalPostingWindows()` scores UTC hours by how many audience timezones fall within engagement hours (8 AM - 9 PM local).

The organization also has a `defaultTimezone` field used as the fallback for system-level operations (reports, cron jobs).

## Consequences

**Benefits:**

- Zero npm dependencies for timezone handling; Intl API is built into Node.js 18+ and all modern browsers.
- DST transitions are handled automatically by the Intl API using the IANA timezone database.
- UTC-only storage eliminates ambiguity; every timestamp has exactly one interpretation.
- Per-user timezone means a Sydney-based manager and a London-based editor see the same schedule in their respective local times.

**Trade-offs:**

- `Intl.supportedValuesOf('timeZone')` requires Node.js 18+; older runtimes need a polyfill.
- The `fromUTC`/`toUTC` conversion uses an iterative refinement approach that adds ~1ms per call.
- Cookie-based timezone detection requires a client-side JavaScript snippet before first server render.

## Alternatives Considered

| Alternative | Reason Rejected |
|---|---|
| **date-fns-tz** | Adds 15KB dependency for functionality already in the Intl API |
| **Luxon** | Heavy library (~70KB); Intl API covers all required operations |
| **moment-timezone** | Deprecated; large bundle size with embedded timezone database |
| **Store offsets instead of IANA** | Offsets change with DST; IANA strings are the canonical timezone identifier |
| **Organization-level timezone only** | Teams span multiple timezones; per-user is necessary for correct display |
