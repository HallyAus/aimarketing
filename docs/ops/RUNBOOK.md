# ReachPilot Operational Runbook

This runbook covers incident response procedures, routine maintenance tasks, and recovery steps for ReachPilot infrastructure.

---

## Infrastructure Overview

```
Internet -> Cloudflare Edge (CDN, SSL, DDoS)
  -> Vercel (Next.js web app + API routes)
  -> Proxmox VM -> Docker Compose
    -> worker (BullMQ, 9 queues)
    -> postgres (PostgreSQL 16, 512MB limit)
    -> redis (Redis 7, 192MB limit, noeviction policy)
```

**Health endpoints:**
- `GET /api/health` -- Overall status
- `GET /api/health/db` -- PostgreSQL connectivity
- `GET /api/health/redis` -- Redis connectivity

---

## Incident Response

### Database Down

**Symptoms:** App returns 503 on all pages. Health check `/api/health/db` fails.

**Impact:** Full outage. No pages load, no API calls succeed.

**Response:**

1. Check container status:
   ```bash
   docker compose ps db
   docker compose logs --tail=50 db
   ```
2. If the container is stopped, restart it:
   ```bash
   docker compose up -d db
   ```
3. If the container is running but unresponsive, check disk space:
   ```bash
   df -h
   docker exec reachpilot-db pg_isready -U reachpilot
   ```
4. Check for connection exhaustion:
   ```bash
   docker exec reachpilot-db psql -U reachpilot -c "SELECT count(*) FROM pg_stat_activity;"
   ```
5. If disk is full, identify and clean up:
   ```bash
   docker exec reachpilot-db psql -U reachpilot -c "SELECT pg_size_pretty(pg_database_size('reachpilot'));"
   ```
6. Last resort -- restart the container:
   ```bash
   docker compose restart db
   ```
7. Verify recovery: `curl https://app.reachpilot.io/api/health/db`

---

### Redis Down

**Symptoms:** Slower response times. BullMQ workers stop processing. Cached data returns stale.

**Impact:** Degraded. The web app continues to function because the cache layer degrades gracefully (all reads fall back to PostgreSQL). Scheduled post publishing is paused.

**Response:**

1. Check container status:
   ```bash
   docker compose ps redis
   docker compose logs --tail=50 redis
   ```
2. Verify Redis is responsive:
   ```bash
   docker exec reachpilot-redis redis-cli ping
   ```
3. Check memory usage (noeviction policy means Redis rejects writes when full):
   ```bash
   docker exec reachpilot-redis redis-cli info memory | grep used_memory_human
   ```
4. If memory is full, check for stuck queues:
   ```bash
   docker exec reachpilot-redis redis-cli keys "bull:*" | wc -l
   ```
5. Restart if needed:
   ```bash
   docker compose restart redis
   ```
6. After recovery, verify workers resume:
   ```bash
   docker compose logs --tail=20 worker
   ```

**Automatic recovery:** The cache layer (`apps/web/src/lib/cache.ts`) silently returns null on Redis failures. Rate limiting falls back to in-memory. BullMQ workers automatically reconnect and resume processing.

---

### Stripe Webhook Failures

**Symptoms:** Billing pages show stale data. New subscriptions are not reflected. Invoices missing.

**Impact:** Billing data becomes out of sync. Users may not see plan upgrades. No impact on publishing or content features.

**Response:**

1. Check Stripe webhook dashboard: https://dashboard.stripe.com/webhooks
2. Look for failed deliveries and review error messages.
3. Verify the webhook signing secret matches:
   ```bash
   echo $STRIPE_WEBHOOK_SECRET
   ```
4. Test webhook endpoint:
   ```bash
   stripe trigger customer.subscription.updated
   ```
5. If events were missed, replay them from the Stripe dashboard (Events tab -> Resend).
6. Verify the webhook endpoint is accessible:
   ```bash
   curl -X POST https://app.reachpilot.io/api/stripe/webhook -v
   # Should return 400 "Missing stripe-signature header" (not 404 or 500)
   ```
7. Check application logs for processing errors:
   ```bash
   # In Vercel dashboard -> Deployments -> Logs
   # Filter for "[stripe-webhook]"
   ```

**Stripe auto-retry:** Stripe retries failed webhook deliveries for up to 3 days with exponential backoff. If the endpoint recovers within that window, events will be processed automatically.

---

### Platform API Rate Limits

**Symptoms:** Publishing fails for specific platforms. Worker logs show rate limit errors. Posts stuck in SCHEDULED or PUBLISHING status.

**Impact:** Posts for the affected platform are delayed. Other platforms continue normally.

**Response:**

1. Check worker logs for rate limit messages:
   ```bash
   docker compose logs worker | grep -i "rate.limit"
   ```
2. Identify which platform is affected and the retry-after header value.
3. BullMQ automatically retries with exponential backoff. Monitor for recovery:
   ```bash
   docker compose logs -f worker | grep "campaign:publish"
   ```
4. If persistent (e.g., daily API quota exceeded), pause publishing for that platform:
   - Use the admin dashboard to identify affected organizations
   - The org can pause publishing via Settings -> Pause Publishing
5. Review and adjust worker concurrency if hitting limits consistently.

**Per-platform limits:**
| Platform | Rate Limit |
|----------|-----------|
| Facebook/Instagram | 200 calls/user/hour |
| Twitter/X | 300 tweets/3 hours |
| LinkedIn | 100 posts/day |
| TikTok | 100 calls/user/day |
| YouTube | 10,000 quota units/day |

---

### Token Refresh Failures

**Symptoms:** Posts fail to publish with authentication errors. Connection status changes to EXPIRED.

**Impact:** Affected accounts cannot publish or fetch analytics until re-authenticated.

**Response:**

1. Check the `token:health-check` queue for failures:
   ```bash
   docker compose logs worker | grep "token:health-check"
   ```
2. Identify affected connections:
   ```sql
   SELECT id, platform, status, "tokenExpiresAt"
   FROM "PlatformConnection"
   WHERE status = 'EXPIRED' OR "tokenExpiresAt" < NOW();
   ```
3. For connections with valid refresh tokens, the `token:refresh` worker should automatically refresh them. Verify:
   ```bash
   docker compose logs worker | grep "token:refresh"
   ```
4. If auto-refresh fails (refresh token also expired), the user must re-authenticate:
   - The dashboard shows a "Reconnect" prompt for expired connections.
   - The user clicks through the OAuth flow again.
5. For bulk expiry (e.g., platform revoked app access), check the platform's developer console for app status and compliance issues.

---

### Deployment Rollback (Vercel)

**Symptoms:** New deployment causes errors or broken functionality.

**Response:**

1. Open Vercel dashboard: https://vercel.com/team/reachpilot/deployments
2. Find the last known good deployment.
3. Click the three-dot menu -> "Promote to Production".
4. This is instant; no rebuild required.
5. Investigate the broken deployment in a preview branch before re-deploying.

**Worker rollback (Docker):**

```bash
# List available images
docker images | grep reachpilot-worker

# Roll back to previous image
docker compose -f docker-compose.prod.yml pull worker
docker compose -f docker-compose.prod.yml up -d worker

# Or use a specific image tag:
# Edit docker-compose.prod.yml to pin the previous tag, then:
docker compose -f docker-compose.prod.yml up -d worker
```

---

### Full System Recovery

If the Proxmox VM needs to be rebuilt:

1. Provision a new VM (Ubuntu 22.04+, 4GB RAM minimum).
2. Install Docker and Docker Compose.
3. Clone the repository:
   ```bash
   git clone https://github.com/HallyAus/aimarketing.git
   cd aimarketing
   ```
4. Restore environment variables from backup.
5. Start infrastructure:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```
6. Restore PostgreSQL from backup:
   ```bash
   docker exec -i reachpilot-db psql -U reachpilot < backup.sql
   ```
7. Run any pending migrations:
   ```bash
   npx prisma migrate deploy
   ```
8. Verify health endpoints.

---

## Routine Maintenance

### Monthly

- [ ] Review audit logs for suspicious activity (`AuditLog` table)
- [ ] Clean up soft-deleted records older than 90 days
- [ ] Run token health check across all connections (`token:health-check` queue)
- [ ] Review error rates in Vercel logs
- [ ] Check disk usage on Proxmox VM
- [ ] Verify database backup schedule is running

### Quarterly

- [ ] Rotate `MASTER_ENCRYPTION_KEY` and re-encrypt all tokens
- [ ] Audit npm dependencies (`pnpm audit`)
- [ ] Reconcile Stripe billing data with database
- [ ] Review and update rate limit thresholds
- [ ] Check PostgreSQL query performance (`pg_stat_statements`)
- [ ] Vacuum and analyze database tables

### Annually

- [ ] Review and update Terms of Service and Privacy Policy
- [ ] Audit security practices and access controls
- [ ] Review NEXTAUTH_SECRET rotation
- [ ] Evaluate infrastructure scaling needs
- [ ] Review platform API changes and deprecations

---

## Useful Commands

```bash
# Database size
docker exec reachpilot-db psql -U reachpilot -c "SELECT pg_size_pretty(pg_database_size('reachpilot'));"

# Largest tables
docker exec reachpilot-db psql -U reachpilot -c "
  SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
  FROM pg_catalog.pg_statio_user_tables
  ORDER BY pg_total_relation_size(relid) DESC
  LIMIT 10;
"

# Redis memory
docker exec reachpilot-redis redis-cli info memory

# BullMQ queue sizes
docker exec reachpilot-redis redis-cli keys "bull:*:waiting" | while read key; do
  echo "$key: $(docker exec reachpilot-redis redis-cli llen $key)"
done

# Active connections count
docker exec reachpilot-db psql -U reachpilot -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Check Prisma migration status
cd packages/db && npx prisma migrate status
```
