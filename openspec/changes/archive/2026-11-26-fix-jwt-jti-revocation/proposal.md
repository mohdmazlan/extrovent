# Proposal: Fix JWT jti Revocation Gap

## Why

Logout and refresh-token rotation are silently broken: tokens are minted without a `jti` claim, but every revocation check gates on `isset($decoded->jti)`. Logout returns success without revoking anything, and rotated refresh tokens stay valid — a stolen token cannot be killed for up to 30 days.

## What Changes

- Mint a unique `jti` claim in every access and refresh token
- Reject tokens issued before this fix deploys (one-time forced re-login, closes the 30-day tail of unrevocable pre-fix refresh tokens)
- Clean up expired rows from `blacklisted_tokens` so the table does not grow forever
- No API shape changes: login/logout/refresh request and response formats stay identical

## Capabilities

### New Capabilities

<!-- None — this change repairs existing behavior, it introduces no new capability. -->

### Modified Capabilities

- `user-auth`: Logout/blacklist and refresh-rotation requirements become actually enforceable (revocation works); token-claims requirement gains the `jti` claim; tokens minted before the fix are rejected.

## Impact

**Affected code:**
- `src/Services/JWTService.php` — add `jti` to both generators; reject pre-cutoff tokens in `validateToken()`
- `src/Services/AuthService.php` — no signature changes; login output gains `jti` inside the tokens automatically
- `public/index.php` — refresh/logout handlers unchanged in shape; their existing `isset($decoded->jti)` gates start firing; add expired-row cleanup
- `src/Middleware/AuthMiddleware.php` — blacklist check starts firing for all new tokens

**API changes:** None (same endpoints, same request/response shapes; token strings get a new claim inside).

**Deploy note:** All users are logged out once on deploy (pre-fix tokens rejected) and must log in again. Coordinate with the Android client so a 401 on refresh triggers re-login, not a crash loop.
