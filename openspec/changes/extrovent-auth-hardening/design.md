# Design

## Context

Extrovent web auth is `extrovent_web/src/lib/apiClient.ts:32` in-memory `accessToken` + plain `extrovent_refresh_token` with a 401 guard that requires `accessToken` to retry, and `src/auth/AuthContext.tsx:28` that validates only via `/user/profile` on mount. Merpati uses plain `localStorage access_token / refresh_token / user` (`merpati/web/src/contexts/AuthContext.tsx:34`), `axios` interceptors with queued 401 retry and keep-alive (`merpati/web/src/api/client.ts:17`), identifier = email or username (`merpati/backend/src/Auth/AuthController.php:99`), and a 6-month sliding session via `AuthGuard` touch (`merpati/backend/src/Auth/AuthGuard.php:43`). See proposal for why.

## Goals / Non-Goals

**Goals:**
- Bring extrovent web auth to merpati parity: identifier login, queued refresh without accessToken guard, and 6-month sliding keep-alive, plus a tiny `validateToken` expiry gate.
- Keep changes isolated to `src/lib/*` and `src/auth/*`/`src/pages/LoginPage.tsx`; no new dependencies beyond existing `axios`/`fetch` pattern.
- Maintain backwards compatibility for existing plain-key sessions via one-time migration to `access_token/refresh_token`.

**Non-Goals:**
- Tenanted `merchant_code` login (`hrms UnifiedAuthService.php:44`) — explicitly not needed per user direction; extrovent stays single-tenant with `identifier`.
- Encrypted `ess_` storage (`hrms/secureStorage.ts:35`) — merpati proves plain `localStorage` is sufficient; keep plain keys `access_token/refresh_token` like merpati.
- Google OAuth and SSO tickets (`merpati/backend/src/Auth/AuthController.php:196`) — not required for extrovent.

## Decisions

**1. Plain token keys `access_token/refresh_token/user` matching merpati, plus tiny `validateToken` helper.**
Why: Merpati `AuthContext.tsx:34` stores exactly those three keys in plain localStorage and works production; HRMS encryption is obfuscation only and adds async complexity. Keep plain keys for simplicity, add `validateToken(token)` that decodes `exp` and rejects expired tokens pre-flight (practical hardening HRMS had, merpati lacked) without needing a separate `secureStorage.ts` file. Alternative — encrypted `ext_` store — rejected per user direction to refer merpati, and plain is easier to debug.

**2. Axios-style interceptors (or fetch equivalent) with queue, remove `&& accessToken` guard.**
Refresh shall proceed if `refresh_token` exists even when `accessToken` is null. Implementation mirrors `merpati/web/src/api/client.ts:25`: `isRefreshing` boolean + `failedQueue`, request interceptor adds `Bearer` from `localStorage.getItem('access_token')`, response interceptor on 401 (excluding `/auth/refresh`) queues, does `POST /auth/refresh {refresh_token}` via `axios`/`fetch` without `Authorization`, stores new pair, dispatches `merpati:token-refreshed`, retries. `apiFetch` can keep `fetch` but adopt the same queue/single-flight pattern. Alternative — keep single `fetch` without queue — rejected: parallel 401s would duplicate refresh.

**3. Sliding session via backend touch + frontend keep-alive, no `remember_me`.**
Replicate `merpati/backend/src/Auth/AuthGuard.php:43` `UPDATE user_sessions SET last_activity_at/expires_at = now + 6m` on every auth, and `merpati/web/src/api/client.ts:94` keep-alive `GET /users/me` every 5 minutes when not hidden and token present. Extrovert needs no `remember_me` flag or 30m idle warning; sliding forever if active is the model. Alternative — HRMS 30m idle + remember_me — rejected: over-engineered for extrovent, user explicitly said no merchant/remember.

**4. Identifier normalization for login/register.**
`login(identifier,password)` where identifier may be `alice` or `alice@example.com` or `@alice`, trimmed, case-insensitive for username as in `merpati/backend/src/Auth/AuthController.php:99` `extractIdentifier`. Register keeps `email,password,username,display_name` shape from merpati `AuthController.php:27` instead of extrovent's current `user_id,email,password,nickname`.

**5. Rate-limit surfacing via `ApiError.data`.**
Backend already returns 429 with `retry_after` (`merpati/backend/src/Auth/AuthController.php:124` / `AuthenticationMiddleware.php:145`); client maps `status===429` to UI. No backend change.

**6. Migration:** on first read, check legacy `extrovent_refresh_token` and any `ext_`/`ess_` keys; if present and `access_token` missing, migrate value to `refresh_token` and delete legacy. Allows zero-logout upgrade.

## Risks / Trade-offs

- **Plain storage is XSS-readable:** Mitigation: same as merpati production risk acceptance; recommend `httpOnly` cookies long-term if backend moves that way.
- **Keep-alive every 5m adds background load:** Mitigation: skip when `document.hidden` and when no token, as merpati does `client.ts:99`.
- **Queued refresh may hold many pending requests:** Mitigation: `failedQueue` resolves once with new token, matching merpati; timeout if refresh hangs.
- **Legacy migration race:** Mitigation: attempt migration on every `getToken()` until success, delete legacy atomically.

## Migration Plan

1. Ship `validateToken` helper + `apiClient` queue/keep-alive, with dual-read for legacy `extrovent_refresh_token`.
2. Flip `AuthContext` to `identifier` API and plain `access_token/refresh_token/user` storage; update `LoginPage`/`RegisterPage`.
3. Verify `npm run build` + `npm test`, login via email and username (@-optional), parallel 401s share one refresh, keep-alive slides session.
4. Rollback: revert to previous `apiClient` plain single-key; no backend rollback needed.

## Open Questions

- None blocking; if extrovent later needs tenant, reintroduce `merchant_code` as optional `identifier` prefix, but current spec is intentionally no-tenant.
