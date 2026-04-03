# OAuth Token Lifecycle Audit

**Date:** 2026-04-03
**Scope:** Token storage encryption, health monitoring, expiry tracking

---

## 1. Token Encryption: PASS

Tokens are encrypted at the application level using AES-256-GCM before being stored in the database.

**Implementation:** `packages/shared/src/encryption.ts`

- Algorithm: `aes-256-gcm`
- IV length: 12 bytes (randomly generated per encryption)
- Auth tag length: 16 bytes
- Output: base64-encoded `[IV || ciphertext || authTag]`
- Key: supplied as a hex-encoded 256-bit key via environment variable

**Schema confirmation** (`packages/db/prisma/schema.prisma`):

```prisma
model PlatformConnection {
  accessToken    String   // Encrypted at application level
  refreshToken   String?  // Encrypted at application level
}

model Page {
  accessToken    String   // encrypted page-specific access token
}
```

Both `PlatformConnection` and `Page` models store tokens as opaque encrypted strings. Plaintext tokens are never persisted.

---

## 2. Token Expiry Tracking: PARTIAL

The `PlatformConnection` model includes a `tokenExpiresAt DateTime?` field, which is populated during the OAuth callback flow.

**Gap:** There is no `tokenHealth` enum field or `tokenCheckedAt` timestamp on the model. Health is currently inferred at read time rather than persisted.

**Recommendation:** Add `tokenHealth` and `tokenCheckedAt` fields to `PlatformConnection` in a future migration for faster queries and dashboard rendering. This is a non-blocking enhancement.

---

## 3. Token Health Check Utility: ADDED

**File:** `apps/web/src/lib/token-health.ts`

Provides:

- `calculateTokenHealth(platform, tokenExpiresAt, connectionStatus)` -- returns status, label, color, remaining time, and whether user action is required
- `TOKEN_TTL` -- per-platform access token TTL and refresh support reference
- `tokenHealthIcon(status)` -- maps status to icon type for UI rendering

Health statuses:
| Status | Meaning | Color |
|---|---|---|
| HEALTHY | Token valid, >20% TTL remaining | Green |
| EXPIRING_SOON | <20% TTL remaining | Amber |
| EXPIRED | Past expiration | Red |
| REFRESH_FAILED | Auto-refresh attempted and failed | Red |
| REVOKED | User or platform revoked access | Red |

---

## 4. Platform Token TTL Reference

| Platform | Access Token TTL | Refresh Support | Notes |
|---|---|---|---|
| Facebook | 60 days | No (token exchange) | Must re-auth after expiry |
| Instagram | 60 days | No (uses FB Graph API) | Same as Facebook |
| TikTok | 24 hours | Yes (365-day refresh) | Aggressive refresh needed |
| Twitter/X | 2 hours | Yes (rotating refresh) | Refresh tokens rotate on use |
| LinkedIn | 60 days | Yes (365-day refresh) | Standard OAuth2 |
| YouTube | 1 hour | Yes (no expiry) | Google OAuth2 |
| Google Ads | 1 hour | Yes (no expiry) | Google OAuth2 |
| Pinterest | 30 days | Yes (365-day refresh) | Standard OAuth2 |
| Snapchat | 30 minutes | Yes (no expiry) | Most aggressive refresh |

---

## 5. Token Health Indicators: ADDED

The connections page (`apps/web/src/app/(dashboard)/settings/connections/page.tsx`) now displays token health indicators next to each connected platform. Indicators show:

- A colored dot (green/amber/red) reflecting the token health status
- Remaining time text for expiring tokens
- "Reconnect" prompt when tokens have expired or been revoked

---

## 6. Token Exposure Audit

| Check | Status |
|---|---|
| Tokens never returned in API responses | PASS -- API endpoints return account metadata only, not token values |
| Tokens never logged | PASS -- logger calls reference account IDs, not token strings |
| Tokens not in error messages | PASS -- errors reference connection IDs |
| Admin dashboard shows health, not values | PASS -- UI displays status badges |

---

## 7. Recommendations for Future Work

1. **Proactive refresh job:** Implement a BullMQ repeating job (every 15 minutes) that checks `tokenExpiresAt` against the platform's proactive refresh threshold and enqueues refresh tasks.
2. **Concurrent refresh protection:** Use Redis-based locking to prevent multiple workers from refreshing the same token simultaneously.
3. **Persisted health status:** Add `tokenHealth` enum and `tokenCheckedAt` fields to `PlatformConnection` for efficient dashboard queries.
4. **User notifications:** Email alerts when a token expires and auto-refresh fails.
5. **Scope validation:** Compare scopes on re-authentication and warn if permissions were reduced.
6. **Disconnection cleanup:** When a user disconnects, revoke the token on the platform side, cancel pending BullMQ jobs, and mark scheduled posts as cancelled.
