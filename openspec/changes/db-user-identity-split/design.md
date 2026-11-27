# Design

## Context

See `proposal.md` Why. Current `users.user_id VARCHAR(16) PK` is both the stable FK target and the mutable login handle (`username` can change). All FKs (`posts`, `place`, `events`, `activity`, `friends`, `chat_*`, `business_profile`, rating/image tables) store that mutable string. `user_details` holds `first_name/last_name/no_phone/department_id` separately, requiring a join for every profile read and a split update path that is currently buggy (`UserService` tried to update `users` with `first_name`). `users.password` lives in the same row as display data. Baseline is MySQL with `migrate.php` auto-baseline; all timestamps already have `DEFAULT CURRENT_TIMESTAMP` from `standardize_timestamps`.

## Goals / Non-Goals

**Goals:**
- Stable `users.id CHAR(36)` UUID PK, not AI, never changes; `username`/`email` become mutable UNIQUE columns in `users` with zero-join display and login lookup.
- Isolate secrets: `user_credentials (user_id FK, password_hash)` holds only `password_hash` (future `reset_token`), no username/email duplication.
- Consolidate profile: `first_name/last_name/no_phone` move into `users`, drop `user_details` entirely and `department_id`.
- Re-point 10+ FK tables to `users.id` UUID with an idempotent, online migration (fresh `DROP DATABASE; php migrate.php` must still work).
- Keep JWT `sub` as UUID, keep Bearer/refresh/session behavior unchanged.

**Non-Goals:**
- No engine change (MyISAM → InnoDB) and no charset/collation change in this change.
- No 2FA, email verification, or role system changes.
- No change to `posts.create_date` (already `create_date`) or other timestamp defaults.
- No literal "different DATABASE" for credentials — stays same DB, separate TABLE (HRMS/Merpati pattern).

## Decisions

**1. PK = UUID CHAR(36) string, not BIGINT AI**
- Rationale: Matches HRMS `VARCHAR(50)` PK and the explicit "PK will not be AI" constraint; UUID is non-sequential, non-guessable, distributed-safe. `CHAR(36)` stores canonical `xxxxxxxx-xxxx-...` form, compatible with existing `VARCHAR` FK columns after widening.
- Alternative: `BIGINT AI` (Merpati `users.id`) — rejected because spec requires not AI and because AI would still be stable but not the requested shape.
- Alternative: `BINARY(16)` — more compact but requires app/ORM changes to hex handling; `CHAR(36)` keeps queries readable.

**2. Username/email stay in `users` (Option A1)**
- Rationale: Display needs username/email on every card/search/profile without a join; login needs `WHERE username=? OR email=?` without joining `user_credentials`. Matches user's stated "no need to join for security/display".
- Alternative: Username/email in `user_credentials` only — rejected because it would force a JOIN on every display and on the hot login lookup path.

**3. Credentials = password only (A, no history)**
- Rationale: Minimal vault: `user_credentials(user_id FK, password_hash, created_at, updated_at)` holds only `password_hash`; `updated_at` IS the last change timestamp — no separate `password_changed_at` and no `password_history` table for now per "A is better" decision. Password change SHALL reject if `password_verify(new, current_hash)` is true (immediate reuse block).
- Alternative: Duplicate username/email in credentials as source of truth — rejected as sync burden and violates "password only is better" decision.
- Alternative: Full history table `password_history` — rejected for now (would block last N, but adds table and retention policy; can be added later without breaking `updated_at` semantics).

**4. Merge `user_details` into `users` and drop it**
- Rationale: `user_details` was HRMS vestige (`no_ic`/`no_matrik` already removed). `first_name/last_name/no_phone` belong to the identity row; a join for every `GET /user/profile` is waste. Dropping the table simplifies `UserService.getProfile` to single-table read and `updateProfile` to single-table write.
- Alternative: Keep `user_details` as extension — rejected, adds no value after IC/matrik removal.

**5. FK migration via add-new-column → backfill → switch → drop-old**
- For each FK table: `ADD COLUMN user_uuid CHAR(36)`, backfill `user_uuid = (SELECT id FROM users WHERE users.username = old.user_id OR users.email = old.user_id)` (handles legacy data where old `user_id` stored the login handle), add `FOREIGN KEY (user_uuid) REFERENCES users(id)`, then in a second deploy rename `user_uuid` → `user_id` and drop old column, or keep both briefly for backward compat with `COALESCE`. Idempotent checks via `information_schema.COLUMNS` so fresh DB (baseline already has UUID) is a no-op for the ADD.
- Alternative: In-place `MODIFY user_id` from `VARCHAR(16)` to `CHAR(36)` and rewrite values — rejected because it would require updating PK values in place and would break FKs mid-migration with no rollback window.

**6. Login identifier stays `identifier` with username/email alias**
- Keep `AuthService.extractIdentifier` accepting `identifier` (or legacy `user_id`/`email`) and comparing `LOWER(users.username) = LOWER(?) OR LOWER(users.email) = LOWER(?)`, then fetching `password_hash` from `user_credentials` by `users.id`. No API breaking change for clients that already send `identifier`.

## Risks / Trade-offs

- **FK re-point on 10+ tables may lock large tables** → Mitigation: `ALGORITHM=INPLACE` where possible, run during low traffic, and keep old `VARCHAR` column until verified, then drop in a follow-up migration.
- **UUID index fragmentation (random v4)** → Mitigation: Use UUID v7/ULID for time-ordered inserts if fragmentation becomes measurable; baseline `CHAR(36)` can be generated as v7 string without schema change.
- **Old app clients sending `user_id` as login handle** → Mitigation: Keep `identifier` fallback accepting `user_id` param and mapping it to `users.username` for one release, then deprecate.
- **JWT `sub` changes from `user_id` string to UUID** → Mitigation: Issue new tokens on next login; old tokens with old `sub` will fail `users.id` lookup and force refresh/re-login, which is expected. Include `username` in response for clients that cached `user_id`.
- **Data loss on `user_details` drop** → Mitigation: Migration copies `first_name/last_name/no_phone` into `users` before `DROP`; `department_id` is intentionally discarded per spec.

## Migration Plan

1. **DB:** Baseline updated to new `users` shape (`id`, `username`, `email`, `first_name`, `last_name`, `no_phone`, `avatar`, `gender`, no `password`, no `user_details`). New migration `db-user-identity-split` does: `ALTER users ADD id`, backfill UUIDs, add `username`/`first_name` etc., create `user_credentials` and copy `password`, add `user_uuid` to FK tables and backfill, add FKs, then (second phase) drop old `users.user_id` PK and `user_details`, rename `user_uuid` → `user_id`.
2. **Deploy:** `php migrate.php --file=db-user-identity-split.sql` on existing DB; fresh `DROP DATABASE; php migrate.php` auto-imports new baseline and runs all 6 migrations (including this one as no-op for the ADDs, but does the FK backfill).
3. **Backend:** Deploy `AuthService` (new lookup), `UserService` (single-table), `JWTService` (`sub` = UUID) together with DB migration — must be atomic, otherwise old code will query `users.user_id` PK that no longer exists.
4. **Web/App:** Deploy login `username` field and profile 5-field form after backend; old app can still login via `identifier` fallback for one version.
5. **Rollback:** Restore `users` from dump, re-create `user_details` via migration down (re-creates table and copies back), revert FK tables from `user_uuid` backup column.

## Open Questions

- UUID version: default to `UUID v4` string via `MySQL UUID()` or app-generated `ramsey/uuid`? Either satisfies `CHAR(36)`; v7 would be a later optimization without spec change.
