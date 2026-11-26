# Proposal: Modernize Authentication System

## Why

The current authentication system uses simple `login_key` tokens with no rate limiting, session tracking, or refresh mechanism. This makes it vulnerable to brute-force attacks and provides poor user experience (no logout, no session management). The HRMS backend demonstrates a production-ready JWT-based auth system with features we need: rate limiting, token expiration, refresh tokens, and session management.

## What Changes

- Add **JWT access tokens** (short-lived) + **refresh tokens** (long-lived) alongside existing login_key
- Add **rate limiting** on login attempts (5 attempts per 15 minutes per IP)
- Add **session tracking** (IP, device, login time, active status)
- Add **logout/blacklist** functionality (revoke tokens and sessions)
- Add **real-time user validation** (check DB for active status on each request)
- **Backward compatible during transition**: Legacy `login_key` parameter continues to work during transition period
- New endpoints: `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`
- Note: a follow-up change (`enforce-bearer-token-auth`, complete) later removed `login_key` support entirely — Bearer token is now the only accepted auth method

## Capabilities

### New Capabilities

- `user-auth`: Complete authentication flow including login, token management, session tracking, and logout. Covers JWT generation/validation, rate limiting, refresh tokens, and session lifecycle.

### Modified Capabilities

<!-- None yet — this is a new capability -->

## Impact

**Affected code:**
- `src/Services/AuthService.php` — rewrite to use JWT service
- `src/Middleware/AuthenticationMiddleware.php` — add JWT validation middleware
- `public/index.php` — update route handlers for Bearer token auth
- `src/Database/Database.php` — add session management queries

**New dependencies:**
- `firebase/php-jwt` — JWT library
- Session tracking table in database (`user_sessions`)

**API changes:**
- Login response returns `access_token`, `refresh_token`, `expires_in` (legacy `login_key` was later removed entirely by `enforce-bearer-token-auth`)
- Protected endpoints require `Authorization: Bearer <token>` header
- New `/api/auth/refresh` endpoint
- New `/api/auth/logout` endpoint

**Android app migration:**
- Separate change required: `modernize-android-app-auth`
- Will migrate all 50+ API calls from `login_key` to Bearer tokens
