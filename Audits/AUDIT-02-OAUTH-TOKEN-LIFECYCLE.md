# AdPilot — Audit 2: OAuth Token Lifecycle

> **For use in Claude Code against the `HallyAus/aimarketing` repo**
> Run autonomously. Fix issues, commit, move on.

---

## CONTEXT

AdPilot connects to 9 social platforms via OAuth. Each platform has different token expiry rules, refresh flows, and rate limits. If tokens break silently, scheduled posts fail and users see no explanation. This audit ensures every token is encrypted, proactively refreshed, and monitored.

**Output:** `docs/oauth/OAUTH-AUDIT.md`

---

## PHASE 1: TOKEN STORAGE ENCRYPTION

### 1.1 — Audit Current Storage

```bash
grep -rn "accessToken\|refreshToken" prisma/schema.prisma
grep -rn "accessToken\|refreshToken" src/ --include="*.ts" --include="*.tsx" | head -30
```

- Are tokens stored as plaintext `String` in Prisma? **→ CRITICAL. Encrypt immediately.**
- Implement `src/lib/encryption.ts` with AES-256-GCM (see Security Audit prompt for implementation)
- Create a migration to encrypt all existing plaintext tokens
- Update all token read/write operations to use encrypt/decrypt
- Add `TOKEN_ENCRYPTION_KEY` to `.env.example`
- Verify: tokens in the database are unreadable without the key

### 1.2 — Token Exposure Audit

- [ ] Tokens never returned in any API response
- [ ] Tokens never logged in any logger call or console output
- [ ] Tokens never included in error messages or BullMQ job payloads (store accountId, look up token in the worker)
- [ ] Admin dashboard shows token health status but never token values

---

## PHASE 2: PLATFORM-SPECIFIC TOKEN MANAGEMENT

Create `src/lib/oauth/` directory with a handler per platform.

### 2.1 — Token Expiry Rules

Create `src/lib/oauth/token-config.ts`:

```typescript
export const TOKEN_CONFIG: Record<Platform, {
  accessTokenTTL: number | null;       // seconds, null = does not expire
  refreshTokenTTL: number | null;
  supportsRefresh: boolean;
  proactiveRefreshAt: number;          // refresh when this % of TTL has elapsed
  requiresReauth: boolean;             // must user re-OAuth when token expires?
  rateLimitPerHour: number;
}> = {
  FACEBOOK: {
    accessTokenTTL: 5184000,           // 60 days (long-lived token)
    refreshTokenTTL: null,             // no refresh token — must exchange for new long-lived
    supportsRefresh: false,            // uses token exchange, not refresh_token grant
    proactiveRefreshAt: 0.75,          // refresh at 45 days
    requiresReauth: true,             // after 60 days, user must re-auth
    rateLimitPerHour: 200,
  },
  INSTAGRAM: {
    accessTokenTTL: 5184000,           // 60 days (same as Facebook, uses FB Graph API)
    refreshTokenTTL: null,
    supportsRefresh: false,
    proactiveRefreshAt: 0.75,
    requiresReauth: true,
    rateLimitPerHour: 200,
  },
  TIKTOK: {
    accessTokenTTL: 86400,             // 24 hours — AGGRESSIVE refresh needed
    refreshTokenTTL: 31536000,         // 365 days
    supportsRefresh: true,
    proactiveRefreshAt: 0.5,           // refresh at 12 hours
    requiresReauth: false,
    rateLimitPerHour: 1000,
  },
  TWITTER: {
    accessTokenTTL: 7200,              // 2 hours
    refreshTokenTTL: null,             // refresh tokens don't expire but rotate
    supportsRefresh: true,             // OAuth 2.0 PKCE with rotating refresh tokens
    proactiveRefreshAt: 0.5,           // refresh at 1 hour
    requiresReauth: false,
    rateLimitPerHour: 300,
  },
  LINKEDIN: {
    accessTokenTTL: 5184000,           // 60 days
    refreshTokenTTL: 31536000,         // 365 days
    supportsRefresh: true,
    proactiveRefreshAt: 0.8,
    requiresReauth: false,
    rateLimitPerHour: 100,
  },
  YOUTUBE: {
    accessTokenTTL: 3600,              // 1 hour
    refreshTokenTTL: null,             // doesn't expire unless revoked
    supportsRefresh: true,             // standard Google OAuth2
    proactiveRefreshAt: 0.8,           // refresh at 48 minutes
    requiresReauth: false,
    rateLimitPerHour: 10000,           // quota units, not raw calls
  },
  GOOGLE_ADS: {
    accessTokenTTL: 3600,
    refreshTokenTTL: null,
    supportsRefresh: true,
    proactiveRefreshAt: 0.8,
    requiresReauth: false,
    rateLimitPerHour: 10000,
  },
  PINTEREST: {
    accessTokenTTL: 2592000,           // 30 days
    refreshTokenTTL: 31536000,         // 365 days
    supportsRefresh: true,
    proactiveRefreshAt: 0.75,
    requiresReauth: false,
    rateLimitPerHour: 1000,
  },
  SNAPCHAT: {
    accessTokenTTL: 1800,              // 30 MINUTES — most aggressive
    refreshTokenTTL: null,             // doesn't expire
    supportsRefresh: true,
    proactiveRefreshAt: 0.5,           // refresh at 15 minutes
    requiresReauth: false,
    rateLimitPerHour: 100,
  },
};
```

### 2.2 — Token Refresh Service

Create `src/lib/oauth/token-refresh.ts`:

```typescript
export async function refreshToken(account: ConnectedAccount): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}> {
  const config = TOKEN_CONFIG[account.platform];
  
  switch (account.platform) {
    case 'FACEBOOK':
    case 'INSTAGRAM':
      return refreshFacebookToken(account);
    case 'TIKTOK':
      return refreshTikTokToken(account);
    case 'TWITTER':
      return refreshTwitterToken(account);  // handles rotating refresh tokens
    case 'LINKEDIN':
      return refreshLinkedInToken(account);
    case 'YOUTUBE':
    case 'GOOGLE_ADS':
      return refreshGoogleToken(account);
    case 'PINTEREST':
      return refreshPinterestToken(account);
    case 'SNAPCHAT':
      return refreshSnapchatToken(account);
    default:
      throw new Error(`No refresh handler for ${account.platform}`);
  }
}
```

Each platform refresh function MUST:
1. Decrypt the current token from the database
2. Call the platform's token refresh endpoint
3. Handle platform-specific quirks (Twitter rotates refresh tokens, Facebook uses token exchange)
4. Encrypt and store the new tokens
5. Update `tokenExpiresAt` on the ConnectedAccount
6. Return the new token data

### 2.3 — Concurrent Refresh Protection

If two BullMQ workers need the same token simultaneously, both might try to refresh:

```typescript
// src/lib/oauth/token-refresh.ts
import { getRedis } from '../redis';

async function refreshWithLock(accountId: string): Promise<void> {
  const redis = getRedis();
  const lockKey = `token-refresh-lock:${accountId}`;
  
  // Try to acquire lock (10-second TTL)
  const acquired = await redis.set(lockKey, '1', 'EX', 10, 'NX');
  
  if (!acquired) {
    // Another process is refreshing — wait for it
    await waitForRefresh(accountId, 15000); // wait up to 15s
    return;
  }
  
  try {
    const account = await prisma.connectedAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new Error('Account not found');
    
    // Double-check: maybe another process already refreshed
    if (account.tokenExpiresAt && account.tokenExpiresAt > new Date(Date.now() + 300000)) {
      return; // token was refreshed while we waited, still valid for 5+ minutes
    }
    
    const newTokens = await refreshToken(account);
    
    await prisma.connectedAccount.update({
      where: { id: accountId },
      data: {
        accessToken: encrypt(newTokens.accessToken),
        refreshToken: newTokens.refreshToken ? encrypt(newTokens.refreshToken) : undefined,
        tokenExpiresAt: newTokens.expiresAt,
        lastSyncAt: new Date(),
      },
    });
  } finally {
    await redis.del(lockKey);
  }
}
```

---

## PHASE 3: PROACTIVE TOKEN REFRESH

### 3.1 — Scheduled Refresh Job

Create a BullMQ repeating job that checks all tokens:

```typescript
// Runs every 15 minutes
await maintenanceQueue.add('check-token-health', {}, {
  repeat: { pattern: '*/15 * * * *' },
  jobId: 'check-token-health',
});

// Worker
async function checkTokenHealth() {
  const accounts = await prisma.connectedAccount.findMany({
    where: { isActive: true },
    select: { id: true, platform: true, tokenExpiresAt: true },
  });
  
  for (const account of accounts) {
    const config = TOKEN_CONFIG[account.platform];
    if (!account.tokenExpiresAt) continue;
    
    const ttl = config.accessTokenTTL;
    if (!ttl) continue;
    
    const expiresAt = account.tokenExpiresAt.getTime();
    const createdAt = expiresAt - (ttl * 1000);
    const refreshThreshold = createdAt + (ttl * 1000 * config.proactiveRefreshAt);
    
    if (Date.now() >= refreshThreshold) {
      // Token needs proactive refresh
      await ingestionQueue.add('refresh-token', {
        accountId: account.id,
        reason: 'proactive',
      }, {
        jobId: `refresh-${account.id}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    }
  }
}
```

### 3.2 — Refresh on Failure

When any API call to a platform returns 401/403:

```typescript
async function callPlatformAPI(account: ConnectedAccount, request: () => Promise<Response>): Promise<Response> {
  let response = await request();
  
  if (response.status === 401 || response.status === 403) {
    // Token expired — try to refresh
    try {
      await refreshWithLock(account.id);
      // Reload account with new token
      const refreshed = await prisma.connectedAccount.findUnique({ where: { id: account.id } });
      if (refreshed) {
        response = await request(); // retry with new token
      }
    } catch (refreshError) {
      await markAccountUnhealthy(account.id, 'Token refresh failed');
      throw refreshError;
    }
  }
  
  return response;
}
```

---

## PHASE 4: TOKEN HEALTH MONITORING

### 4.1 — Health Status Field

Add to `ConnectedAccount` model if not present:

```prisma
model ConnectedAccount {
  tokenHealth     TokenHealth @default(HEALTHY)
  tokenError      String?     // last error message
  tokenCheckedAt  DateTime?   // last health check
}

enum TokenHealth {
  HEALTHY
  EXPIRING_SOON   // within 20% of TTL
  EXPIRED
  REFRESH_FAILED
  REVOKED
}
```

### 4.2 — Health Check Logic

```typescript
export function calculateTokenHealth(account: ConnectedAccount): TokenHealth {
  const config = TOKEN_CONFIG[account.platform];
  
  if (!account.tokenExpiresAt) return 'HEALTHY'; // no expiry (some platforms)
  
  const now = Date.now();
  const expiresAt = account.tokenExpiresAt.getTime();
  
  if (now >= expiresAt) return 'EXPIRED';
  
  const ttl = config.accessTokenTTL;
  if (ttl) {
    const remaining = (expiresAt - now) / 1000;
    if (remaining < ttl * 0.2) return 'EXPIRING_SOON';
  }
  
  return 'HEALTHY';
}
```

### 4.3 — User Notifications

- When token status changes to `EXPIRING_SOON`: show yellow warning in page switcher
- When token status changes to `EXPIRED` or `REFRESH_FAILED`: show red alert banner on dashboard: "Your [Platform] connection needs attention. [Reconnect]"
- Email notification when a token expires and auto-refresh fails

---

## PHASE 5: DISCONNECTION & REVOCATION

When a user disconnects an account:

1. Revoke the token on the platform side (call the platform's revoke endpoint)
2. Delete the encrypted tokens from the database
3. Cancel any pending BullMQ jobs for this account
4. Mark posts as CANCELLED if they were SCHEDULED for this account
5. Log the disconnection in the audit log

```typescript
async function disconnectAccount(accountId: string, userId: string): Promise<void> {
  const account = await prisma.connectedAccount.findUnique({ where: { id: accountId } });
  if (!account) throw new ApiError(404, 'NOT_FOUND', 'Account not found');
  
  // 1. Revoke on platform
  try {
    await revokePlatformToken(account);
  } catch {
    // Log but don't block — the token will expire anyway
    logger.warn('Platform token revocation failed', { accountId, platform: account.platform });
  }
  
  // 2. Remove tokens and deactivate
  await prisma.connectedAccount.update({
    where: { id: accountId },
    data: {
      accessToken: '', // clear encrypted token
      refreshToken: null,
      isActive: false,
      tokenHealth: 'REVOKED',
    },
  });
  
  // 3. Cancel pending jobs
  // ... remove from BullMQ
  
  // 4. Cancel scheduled posts
  await prisma.post.updateMany({
    where: { accountId, status: 'SCHEDULED' },
    data: { status: 'CANCELLED' },
  });
  
  // 5. Audit log
  await logAuditEvent('account.disconnected', userId, { accountId, platform: account.platform });
}
```

---

## PHASE 6: SCOPE VALIDATION

When a user re-authenticates (reconnects) an account:

- Compare the new scopes with the previously stored scopes
- If scopes were reduced (platform removed permissions): warn the user, update stored scopes, disable features that require the missing scopes
- If scopes were expanded: update stored scopes, enable newly available features
- Log scope changes in the audit log

---

## EXECUTION RULES

1. Fix every finding. Commit with `security:` or `feat:` prefix.
2. Token encryption is the #1 priority — if tokens are plaintext, stop everything and encrypt them first.
3. Document all platform-specific quirks in `docs/oauth/PLATFORM-NOTES.md`.
4. Run `npm run build` after every change.

---

☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)
🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.

*Generated for Daniel Hall — AdPilot / Agentic Consciousness — April 2026*
