# Proposal

## Why

All authenticated API calls (`place/list`, `event/list`, `activity/list`, ...) fail with `SQLSTATE[42S22]: Unknown column 'user_id' in 'field list'` after the UUID identity split. `users` now uses `id CHAR(36)` as PK, but auth and search code still queries a `user_id` column that no longer exists. Login succeeds, then Explore and every other protected page shows the SQL error banner.

## What Changes

- Fix `AuthMiddleware::checkUserActive` to query `users.id` instead of `users.user_id`.
- Fix `handleRefreshEndpoint` in `backend/public/index.php` to query `users.id` instead of `users.user_id`.
- Fix `SearchService::search` users branch to select `id` / `id AS user_id` plus `username` instead of bare `user_id`.
- Fix `AuthService::changePassword` legacy fallback to avoid referencing `users.user_id`.
- No envelope, route, or auth-flow changes; error envelope already works.

## Capabilities

### New Capabilities
<!-- none — bugfix restoring intended behavior -->

### Modified Capabilities
<!-- none — `user-auth` requirements already demand user-existence checks; this only corrects the column to `users.id` per `schema.sql`. No requirement text changes. -->

## Impact

- Affected code: `backend/src/Middleware/AuthMiddleware.php`, `backend/public/index.php`, `backend/src/Services/SearchService.php`, `backend/src/Services/AuthService.php`.
- APIs: all `requires_auth` routes (`place/*`, `event/*`, `activity/*`, `post/*`, `friend/*`, `search`) plus `auth/refresh` and `user/password`.
- Dependencies/systems: none new; MySQL `extrovent` on fresh `schema.sql` (33 tables). Frontend needs no changes once backend stops 500ing.
