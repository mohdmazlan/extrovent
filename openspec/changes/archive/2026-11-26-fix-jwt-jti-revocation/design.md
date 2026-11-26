# Design: Fix JWT jti Revocation Gap

## Context

See proposal.md (Why). Current state:
- `JWTService::generateAccessToken()` / `generateRefreshToken()` mint `{ iss, iat, exp, sub, type }` — no `jti`, though a `generateJti()` helper already exists and is never called.
- `AuthMiddleware`, `handleRefreshEndpoint()`, and `handleLogoutEndpoint()` all gate revocation on `isset($decoded->jti)`, so every revocation path is dead code.
- `blacklisted_tokens` has `expires_at` and all reads already filter on it, but nothing ever deletes expired rows.
- Known environment quirk: PHP runs Europe/Berlin while MySQL runs MYT (7h apart). Any expiry math mixing `time()`/`date()` with `NOW()` is skewed — see Risks.

## Goals / Non-Goals

**Goals:**
- Every newly minted token carries a unique `jti`; all three revocation gates start firing.
- Pre-fix tokens (no `jti`) are rejected after deploy — no 30-day unrevocable tail.
- Blacklist table stays bounded via expired-row cleanup.

**Non-Goals:**
- Changing token lifetimes, login/refresh/logout request/response shapes, or the rate limiter.
- Fixing the general PHP/MySQL clock skew (out of scope; worked around locally where this change touches time).
- Android client retry handling (separate change; deploy note in proposal covers the contract).

## Decisions

### Decision 1: Reuse `generateJti()` for both token types
**Why:** The helper exists and matches the column (`VARCHAR(255)`, `bin2hex(random_bytes(32))`). No schema change needed.
**Alternative considered:** Hash-based IDs (e.g. hash of token) — rejected; random jti keeps the token opaque and avoids leaking structure.

### Decision 2: Cutoff via `iat`, not a version claim
**Why:** Pre-fix tokens are exactly "tokens without `jti`". Rejecting jti-less tokens whose `iat` predates the deploy timestamp closes the tail with zero migration and zero new claims. A `v` claim would require backfilling semantics for old tokens anyway.
**Alternative considered:** Accepting the 30-day tail — rejected; a stolen pre-fix refresh token would stay valid and unrevocable for a month.

### Decision 3: Opportunistic blacklist cleanup on the write path
**Why:** No cron infrastructure exists in this project. Deleting `expires_at < NOW()` rows whenever a token is blacklisted bounds the table with no new moving parts.
**Alternative considered:** Cron job — rejected; nothing schedules crons here, and an unmaintained cron is worse than inline cleanup.

### Decision 4: All expiry math on the DB clock
**Why:** The 7h PHP/MySQL skew already broke the rate limiter once (fresh rows looked 7h old). `blacklistToken()` currently formats PHP wall time into `expires_at` while reads compare against `NOW()` — same bug class. Compute expiries with `DATE_ADD(NOW(), INTERVAL ? SECOND)` so writes and reads share one clock.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Deploy logs out every user (pre-fix tokens rejected) | One-time event; login flow is verified working; warn users in advance |
| Double-refresh race logs user out (old token now really revoked) | Intended semantics; Android must treat refresh-401 as re-login (deploy note) |
| `blacklisted_tokens` unique key on `token_jti` + concurrent double logout | `blacklistToken()` already catches duplicate-key failures and returns false — keep that |
| Clock skew still affects `expires_at` display values elsewhere (sessions) | Out of scope; sessions only gate on `expires_at > NOW()` with far-future expiries, so no auth impact |

## Migration Plan

1. Deploy backend (no DB migration needed — no schema changes).
2. All clients re-login once (old tokens rejected).
3. Verify: login → logout → reuse access token → 401; refresh → old refresh token → 401.
4. Rollback: revert the deploy; new tokens (with `jti`) still validate on old code since it ignores unknown claims — safe.

## Open Questions

None — the three explore-time questions (cutoff strategy, cleanup mechanism, client race handling) are decided above.
