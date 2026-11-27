# Proposal: DB User Identity Split — UUID PK, username in users, credentials isolated

## Why

`users.user_id` is today both the PRIMARY KEY and the mutable login handle (`user_id` can change anytime). Every FK (`posts`, `place`, `friends`, `chat_*`, `events`, `activity`) points to that mutable string, so renaming a user requires touching 10+ tables. `user_details` is a vestigial HRMS table (`no_ic`, `no_matrik`, `department_id`) that should not exist as a separate entity. We need a stable, non-AI PK (UUID) and a clean split where `username`/`email` live in `users` for zero-join display/login, and only `password_hash` lives isolated in `user_credentials` — exactly the HRMS/Merpati pattern we already use elsewhere.

## What Changes

- **BREAKING DB:** `users` gets `id CHAR(36) PK` UUID (not AI), `username VARCHAR(100) UNIQUE` mutable, keeps `email UNIQUE`, absorbs `first_name/last_name/no_phone/avatar` from `user_details`; `user_details` table dropped; `department_id`, `no_ic`, `no_matrik` removed.
- **BREAKING DB:** New `user_credentials (user_id FK -> users.id, password_hash VARCHAR(255), created_at, updated_at)` — stores only `password_hash` (A, no history table); `updated_at` is the last change timestamp (no separate `password_changed_at`). `users.password` column dropped after backfill. Password change SHALL reject if new password equals current hash (immediate reuse block, Google-like for now).
- **BREAKING FK:** All `user_id` FK columns (`posts`, `place`, `events`, `activity`, `friends.user_id1/2`, `chat_message`, `chatroom_members`, `event_*`, `place_*`, `post_*`, `business_profile`) migrate from `VARCHAR(16)` login handle to `CHAR(36)` UUID FK to `users.id`.
- **API:** `POST /auth/login` identifier changes from `user_id` to `username` (still accepts `email` as alias, `identifier` field), `GET /user/profile` and `PUT /user/update` now read/write `users` directly (no `user_details` join), password checks read `user_credentials`.
- **App/Web:** Login forms switch field `user_id` → `username`, profile edit drops `no_ic`/`no_matrik`/`department_id` (already done for `no_ic`/`no_matrik`, now also `department_id` and `user_details` indirection), avatar/nickname flows unchanged.
- **Migrations:** Baseline updated to new `users` shape, new migration `cleanup_post_date_and_profile` extended + new `db-user-identity-split` migration handles UUID backfill and FK re-pointing idempotently.

## Capabilities

### New Capabilities
- `user-identity`: Stable UUID identity for users, mutable `username`/`email` in `users`, profile fields consolidated (`first_name`, `last_name`, `no_phone`), `user_details` removed. Covers PK not AI, `username` mutability without FK cascade, and profile merge.

### Modified Capabilities
- `user-auth`: Login identifier becomes `username` (or `email` alias) against `users.username`/`users.email`, password verification reads `user_credentials.password_hash` by `user_id` UUID; JWT `sub` becomes UUID `id` instead of `user_id` string. Rate limiting keys on `username`/`email`.
- `android-auth`: App `POST /auth/login` payload changes `user_id` → `username`, token storage `sub` is now UUID, Bearer header unchanged, silent refresh unchanged.

## Impact

- **DB:** `users` (new PK, new columns, dropped `password`), `user_credentials` (new), `user_details` dropped, 10+ FK tables altered. Requires data migration: generate UUIDs for existing users, backfill `user_credentials`, rewrite FKs. `DROP DATABASE; php migrate.php` still works (auto-baseline).
- **Backend:** `AuthService`, `UserService`, `JWTService`, `UserSessionService`, all `*_Service`/`*_Repository` that query `user_id`, `ResponseFormatter` envelopes unchanged.
- **Web:** `lib/users.ts`, `ProfilePage.tsx`, `AuthContext`, `lib/posts.ts` (user joins).
- **App:** `OutdoorBuddy.java`, `AboutActivity.java`, `ViewProfileActivity.java`, `Session`, `GetProfileDetails`, `UpdateUserDetails`, `List*` adapters.
- **Risk:** Breaking change — old clients sending `user_id` must map to `username`; all FKs must be migrated atomically or app will see orphaned posts.
