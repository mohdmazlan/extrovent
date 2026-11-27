# Proposal

## Why

`extrovent_web` auth is a thin in-memory `accessToken` + plain `localStorage extrovent_refresh_token` (`src/lib/apiClient.ts:33`) with no expiry check, no queued 401 retry, and no sliding session, while `merpati` proves a simpler production pattern: plain `localStorage access_token / refresh_token / user` (`merpati/web/src/contexts/AuthContext.tsx:34`), `axios` interceptors with refresh queue + `merpati:token-refreshed` event (`merpati/web/src/api/client.ts:17`), identifier = email or username (`merpati/backend/src/Auth/AuthController.php:99`), rate-limited login with `ACCOUNT_NOT_FOUND / WRONG_PASSWORD` codes (`php:132`), and a 6-month sliding session via `AuthGuard` touch (`merpati/backend/src/Auth/AuthGuard.php:43`) + 5-minute keep-alive (`merpati/web/src/api/client.ts:94`). Extrovent has no `merchant_code` tenant (unlike HRMS) so merpati's no-tenant shape fits directly. Aligning to that closes blind-401, parallel-refresh races, and stale-session risks before the new shell ships.

## What Changes

- **Identifier, not merchant:** Login becomes `identifier + password` where identifier is email or username (case-insensitive, `@`-optional) per `merpati/backend/src/Auth/AuthController.php:99` `extractIdentifier`, not `merchant_code/username` as in HRMS `UnifiedAuthService.php:44`. No tenant resolve.
- **Client parity with merpati:** Replace in-memory + plain single-key store with `localStorage access_token / refresh_token / user` as in `merpati/web/src/contexts/AuthContext.tsx:34` and add `src/api/client.ts`-style axios interceptors: request adds `Authorization Bearer`, response queues parallel 401s (`isRefreshing` + `failedQueue` `merpati/web/src/api/client.ts:25`), refreshes once via `POST /auth/refresh {refresh_token}` (`merpati/backend/src/Auth/AuthController.php:259`), then retries. No `&& accessToken` guard (`apiClient.ts:145` removed). Wrap `localStorage` in small `validateToken` helper (decode `exp`) to drop expired tokens without a network call — practical hardening merpati lacks but HRMS proves useful (`hrms/secureStorage.ts:81`).
- **Sliding session:** Backend `AuthGuard` touch on every authenticated request (`merpati/backend/src/Auth/AuthGuard.php:43` `last_activity_at/expires_at = now + 6m`) plus frontend keep-alive `GET /users/me` every 5 minutes when not hidden (`merpati/web/src/api/client.ts:94`). Replaces HRMS 30-minute idle + `remember_me` complexity — extrovent needs no `remember_me` toggle.
- **Rate-limit UX (no backend change):** surface `429` + `retry_after` from `RateLimiter` (`merpati/backend/src/Auth/AuthController.php:124` / `AuthenticationMiddleware.php:145`) via `ApiError`.
- **BREAKING (minor):** `ext_` prefixed encrypted keys are dropped; legacy `extrovent_refresh_token` and any `ess_` keys are migrated on first read to `access_token/refresh_token` then removed.

## Capabilities

### New Capabilities
- `auth-client`: Axios interceptor auth (Bearer injection, 401 queue, refresh, keep-alive) matching `merpati/web/src/api/client.ts:17` with no merchant tenant.
- `session-management`: 6-month sliding session via backend `AuthGuard` touch and frontend 5-minute keep-alive (`merpati/backend/src/Auth/AuthGuard.php:43` + `merpati/web/src/api/client.ts:94`), plus local `validateToken` expiry gate.

### Modified Capabilities
- `user-auth`: Extend refresh to work without access token, document identifier = email or username (no merchant) and sliding session semantics, and require client-side pre-flight `exp` validation and rate-limit surfacing.

## Impact

- **Web:** `src/lib/apiClient.ts:33` (replace plain `extrovent_refresh_token` + `isFormData` stays, add async `validateToken`, remove `&& accessToken` guard), `src/api/auth.ts` (new) `login(identifier,password)` / `register(email,password,username,displayName)` mirroring `merpati/web/src/api/auth.ts:4`, `src/lib/theme.ts` untouched, `src/auth/AuthContext.tsx:28` simplified to `identifier` + `localStorage access_token/refresh_token/user` like `merpati/web/src/contexts/AuthContext.tsx:22` (no `rememberMe`), `src/pages/LoginPage.tsx` (`identifier` input, no merchant field, fix `429` UX), `src/lib/secureStorage.ts` optional tiny `validateToken` helper.
- **Backend (docs only, no PHP change):** documents expected `POST /auth/login {identifier,password}` and `POST /auth/register {email,password,username,display_name}` per `merpati/backend/src/Auth/AuthController.php:27/109`, `POST /auth/refresh {refresh_token}` per `php:259`; sliding `last_activity_at` already implied by `user-auth` `Session Tracking`.
- **Dependencies:** `axios` already in use via `merpati/web/src/api/client.ts:1` pattern; no new deps if keep `fetch`.
