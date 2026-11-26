# Design: Modernize Authentication System

## Context

Current system uses simple `login_key` (md5 hash) with no expiration, rate limiting, or session tracking. The HRMS backend demonstrates a production-ready JWT-based auth with rate limiting, refresh tokens, and session management that we're adapting for Extrovent's simpler single-tenant needs.

**Current state:**
- `AuthService::login()` generates random login_key stored in DB
- `AuthMiddleware` checks if login_key exists in `outdoorbuddy_login` table
- No token expiration, no rate limiting, no session tracking
- All authenticated endpoints accept `login_key` as POST parameter

## Goals / Non-Goals

**Goals:**
- Replace login_key with JWT access tokens (24h) + refresh tokens (30d)
- Add rate limiting on login attempts (5 per 15min per IP)
- Track sessions with device/IP info
- Support explicit logout with token blacklisting
- Verify user active status on each request

**Non-Goals:**
- Multi-tenant support (HRMS has this, Extrovent is single-tenant)
- Social login (Google, Facebook, etc.)
- OAuth2 integration
- Password reset flow (future enhancement)
- Role-based access control implementation (just the claim in token)

## Decisions

### Decision 1: Use firebase/php-jwt library
**Why:** Industry standard, well-maintained, PSR-compliant. Avoids rolling our own JWT implementation which is error-prone.
**Alternatives considered:**
- `lcobucci/jwt` — also good but less popular in PHP ecosystem
- Custom implementation — too risky for security-critical code

### Decision 2: Store sessions in database (not Redis)
**Why:** Extrovent doesn't have Redis infrastructure. DB storage is sufficient for current user base. Can migrate to Redis later if needed.
**Trade-off:** Slightly slower lookup than in-memory, but negligible for current scale.

### Decision 3: Keep md5 password hashing temporarily
**Why:** Existing users have md5-hashed passwords. The HRMS system migrated from md5 to bcrypt gradually — we'll do the same.
**Migration path:** On login, if password matches md5, hash it with bcrypt and update DB. Next login uses bcrypt.

### Decision 4: Bearer token in Authorization header
**Why:** Standard REST API pattern. Clients (Android app) already support Bearer tokens. Easier to integrate than passing login_key as POST parameter.
**Impact:** Breaking change — Android app must be updated to send `Authorization: Bearer <token>` instead of `login_key` parameter.

### Decision 5: Separate rate limit middleware from auth middleware
**Why:** Separation of concerns. Rate limiting can be applied to any endpoint, not just login. Auth middleware focuses on token validation.
**Structure:**
```
Request → RateLimitMiddleware → AuthMiddleware → Service
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Breaking change for Android app | Provide migration guide, version both endpoints during transition period |
| Token theft via XSS | Implement httpOnly cookies for web clients (Android uses headers, less risky) |
| Database query on every request for user validation | Add caching layer (APCu/opcache) for active status checks |
| JWT secret key management | Store in .env file, never commit to git |
| Refresh token rotation complexity | Implement simple rotation: issue new refresh token with each refresh, blacklist old one |

## Migration Plan

**Phase 1: Prepare infrastructure (no breaking changes)**
1. Add `firebase/php-jwt` to composer.json
2. Create `user_sessions` table migration
3. Add JWT configuration to .env
4. Implement AuthService::login() with dual output (old login_key + new JWT)

**Phase 2: Deploy auth endpoints (backward compatible)**
5. Add `/api/auth/refresh` endpoint
6. Add `/api/auth/logout` endpoint
7. Keep old login_key validation working during transition

**Phase 3: Client migration**
8. Update Android app to use Bearer tokens
9. Deprecate login_key parameter after 30 days
10. Remove legacy login_key validation

## Open Questions

1. **Token expiration duration:** 24h is standard, but should we make it configurable? (Default: 24h)
2. **Refresh token rotation:** Should we blacklist old refresh tokens immediately or allow reuse within a window? (Recommend: immediate revocation for security)
3. **Device tracking:** How granular should device info be? (Recommend: browser/user-agent string + last 4 octets of IP)
4. **Password migration timeline:** How long before we force bcrypt migration for all users? (Recommend: 90 days from deployment)
