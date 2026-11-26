# Proposal: Enforce Bearer Token Authentication

## Why

The backend currently supports dual authentication (JWT Bearer tokens + legacy `login_key`), but the Android app has not migrated yet. This creates a security gap: the `login_key` is a weak md5 hash with no expiration, and without rate limiting on the login endpoint, the system remains vulnerable to brute-force attacks. Additionally, having two auth methods in parallel increases maintenance burden and creates confusion about which method clients should use.

## What Changes

- **BREAKING**: Remove legacy `login_key` authentication from all endpoints
- All protected endpoints now require `Authorization: Bearer <token>` header only
- Add rate limiting middleware to `/auth/login` (5 attempts per 15 minutes per IP)
- Simplify AuthMiddleware to only handle JWT validation (no login_key fallback)
- Remove `login_key` from login response (return only JWT tokens)
- Services continue to receive `$userId` from middleware (no service changes needed)

## Capabilities

### Modified Capabilities

- `user-auth`: Authentication flow now enforces Bearer token exclusively. Removes login_key support, adds rate limiting on login endpoint, simplifies auth middleware to JWT-only validation.

## Impact

**Affected code:**
- `src/Middleware/AuthMiddleware.php` — Remove login_key fallback, simplify to JWT-only
- `src/Services/AuthService.php` — Remove login_key generation and return from login response
- `public/index.php` — Wire RateLimitMiddleware into auth/login route
- `migrations/` — Optional cleanup of outdoorbuddy_login table (deprecated)

**API changes:**
- Login response no longer includes `login_key` field
- All protected endpoints reject requests without valid Bearer token
- `/auth/login` returns 429 when rate limit exceeded

**Android app impact:**
- Must be updated to send `Authorization: Bearer <token>` instead of `login_key` parameter
- This change should deploy in lockstep with Android app update (separate change)
