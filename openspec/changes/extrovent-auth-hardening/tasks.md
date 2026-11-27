# Tasks

## 1. Client auth foundation (merpati parity, no merchant)

- [x] 1.1 Create `extrovent_web/src/lib/tokenStorage.ts` (or small `validateToken` in `apiClient`) that handles plain `localStorage access_token / refresh_token / user` as in `merpati/web/src/contexts/AuthContext.tsx:34` plus `validateToken(token)` decoding `exp` (3 parts + payload check) and verify `vitest` covers expired-token rejection
- [x] 1.2 Create `extrovent_web/src/api/auth.ts` with `login(identifier,password)` `register(email,password,username,displayName)` `logout(refreshToken)` `getSessions/revokeSession` mirroring `merpati/web/src/api/auth.ts:4` (`identifier` = email or username `@`-optional, case-insensitive) and verify unit test for identifier normalization

## 2. Interceptors and sliding session

- [x] 2.1 Refactor `extrovent_web/src/lib/apiClient.ts:32` (or `src/api/client.ts`) to axios-style interceptors: request adds `Bearer access_token` from `localStorage` (`merpati/web/src/api/client.ts:17`), response queues parallel 401s (`isRefreshing` + `failedQueue` `merpati/web/src/api/client.ts:25`), refreshes once via `POST /auth/refresh {refresh_token}` without `Authorization` (`merpati/backend/src/Auth/AuthController.php:259`), retries original, dispatches `merpati:token-refreshed`, and removes `&& accessToken` guard at `apiClient.ts:145`; verify `npm run build` and `vitest` for 401→refresh→retry without `accessToken` and queue single-flight
- [x] 2.2 Add 5-minute keep-alive `GET /users/me` when not hidden and token present (`merpati/web/src/api/client.ts:94`) to extend sliding window (`merpati/backend/src/Auth/AuthGuard.php:43`), and verify that `document.hidden` pauses it
- [x] 2.3 Refactor `extrovent_web/src/auth/AuthContext.tsx:28` to use `identifier` (`hrms` `user_id` → `merpati` `identifier`), persist `access_token/refresh_token/user` plain like `merpati/web/src/contexts/AuthContext.tsx:22` (no `rememberMe`), update `checkAuth` to validate `exp` and hydrates from storage, and verify login via email and via username both succeed
- [x] 2.4 Extend `apiClient` to surface `429` with `retry_after` (`merpati/backend/src/Auth/AuthController.php:124`) via `ApiError.data` and verify UI shows retry delay

## 3. UI and migration

- [x] 3.1 Update `extrovent_web/src/pages/LoginPage.tsx` and `RegisterPage.tsx` to use `identifier` field (placeholder "Email or username") and map to `AuthContext.login(identifier,password)` / `register(email,password,username,displayName)`, removing any merchant field, and verify manual login with email and with username (@-optional) works
- [x] 3.2 Add legacy migration that on first `getToken` miss reads plain `extrovent_refresh_token` (`apiClient.ts:12` legacy) and `ext_`/`ess_` keys if present, migrates to `access_token/refresh_token`, then deletes legacy keys; verify test that legacy key is consumed once and removed

## 4. Verification

- [x] 4.1 Run `npm run build` and `npm test` (`vitest run`) in `extrovent_web` and verify plain `access_token/refresh_token` keys appear, expired JWT rejected without network, parallel 401s share one refresh, keep-alive slides session (`AuthGuard` touch), and `identifier` login works for email and username
