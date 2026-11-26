# Design: Enforce Bearer Token Authentication

## Context

The backend currently has JWT auth infrastructure (JWTService, UserSessionService, AuthMiddleware with dual-mode support) but it's not fully wired up. The `RateLimitMiddleware` exists but isn't connected to any route. OPcache may be serving stale bytecode. The Android app still uses `login_key`.

**Current state:**
- AuthService generates both login_key AND JWT tokens (if services injected)
- AuthMiddleware tries Bearer first, falls back to login_key
- RateLimitMiddleware class exists but is never instantiated
- All 30+ authenticated endpoints use the same AuthMiddleware
- Services receive `$userId` from middleware (already agnostic to auth method)

## Goals / Non-Goals

**Goals:**
- Remove all login_key references from auth flow
- Wire rate limiting to /auth/login endpoint
- Simplify AuthMiddleware to JWT-only validation
- Ensure services continue working with Bearer tokens only

**Non-Goals:**
- Android app migration (separate change)
- Database cleanup of outdoorbuddy_login table
- Password hash migration (already handled in previous change)

## Decisions

### Decision 1: Wire rate limiting to /auth/login only
**Why:** Login is the only endpoint vulnerable to brute-force. Other endpoints don't accept credentials and can't be exploited this way. Adding rate limiting everywhere is overkill.
**Structure:**
```
/auth/login → RateLimitMiddleware → AuthMiddleware → AuthService::login()
Other routes → AuthMiddleware → Service (no rate limit needed)
```

### Decision 2: Simplify AuthMiddleware to JWT-only
**Why:** Removes dead code path (login_key fallback). Simpler maintenance, clearer security model. The `tryAuthenticateBearer()` method already exists and works; we just remove the fallback to `authenticateLegacy()`.
**Changes:** Remove `authenticateLegacy()` method, remove login_key validation queries.

### Decision 3: Services unchanged
**Why:** Services already receive `$userId` from middleware via `buildMethodArgs()`. They don't care how auth happened — only that a valid user_id was established. No service code needs changes.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Android app breaks on deployment | Deploy Android update FIRST, then backend. Coordinate releases. |
| OPcache serving stale code | Clear OPcache before/during deployment. Set `OPCACHE_ENABLE=0` in dev. |
| Rate limiter table grows with old entries | Background cleanup job or periodic DELETE query on login_attempts table |
| Session tracking data persists | Clean up expired sessions periodically (UserSessionService::cleanupExpiredSessions) |

## Migration Plan

**Step 1: Deploy Android app update** (separate change, must happen first)
- App sends Bearer tokens instead of login_key
- App stores JWT tokens instead of login_key

**Step 2: Clear OPcache and deploy backend**
```bash
php -r "opcache_reset();"
# or restart PHP-FPM/Nginx/Apache
```

**Step 3: Verify endpoints**
- Test /auth/login returns JWT tokens only (no login_key)
- Test protected endpoints accept Bearer tokens
- Test rate limiting on /auth/login (429 after 5 failed attempts)

## Open Questions

1. **Background cleanup for rate limiter:** Should we add a cron job to clean old login_attempts entries, or is the periodic DELETE in checkRateLimit() sufficient?
2. **Session cleanup frequency:** How often should UserSessionService::cleanupExpiredSessions run? (Recommend: on each request as a lightweight check)
