# Tasks

## 1. Auth existence checks — query `users.id`

- [x] 1.1 Fix `AuthMiddleware::checkUserActive` to `SELECT id FROM users WHERE id = ?` and verify an authenticated `GET /place/list` with a valid Bearer token returns 200 instead of 42S22
- [x] 1.2 Fix `handleRefreshEndpoint` in `backend/public/index.php` to `SELECT id FROM users WHERE id = ?` and verify `POST /auth/refresh` with a valid refresh token returns new tokens
- [x] 1.3 Fix `AuthService::changePassword` legacy fallback to avoid `users.user_id` (use `id` / `username` / `email`) and verify password change succeeds when the `user_credentials` row is present

## 2. Search users branch — return usable identity

- [x] 2.1 Fix `SearchService::search` users query to `SELECT id, id AS user_id, username, nickname, avatar` and verify `GET /search?q=<nick>` returns user rows with `user_id` and `username` populated

## 3. Verification

- [x] 3.1 Run `php migrate.php --fresh` and verify 33 tables ready, then login plus `place/list`, `event/list`, `activity/list`, and `search` all return enveloped success with no `Unknown column` errors

## Workflow follow-up

- Review the change before implementation with `/opsx-apply fix-auth-user-id-column` once tasks exist
- Archive the change after review with `/opsx-archive fix-auth-user-id-column`
