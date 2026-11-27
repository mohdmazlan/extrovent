# Proposal: Post-UUID-split repo cleanup

## Why

The UUID identity split is live on the single-file `schema.sql`, but the codebase still carries migration-period scaffolding: dead `Repositories/*` with pre-split joins, guarded legacy fallbacks in live Services, and docs referencing removed files. Dead code that *looks* load-bearing slows every future change and the stale Repositories would fatal if ever resolved.

## What Changes

- Remove `backend/src/Repositories/*` if confirmed dead (no route resolves them; `Container` can but nothing calls it) — otherwise align their joins to `u.id`.
- Strip guarded legacy fallbacks in `AuthService::findUserByIdentifier` and `UserService::{getProfile,viewUser}` that reference the dropped `users.user_id` column / `user_details` table.
- Verify `swagger/openapi.yaml` documents `username` login (not `user_id`), and `backend/tests/` + `migrate_auth.php` don't assume the old shape.
- No behavior change: same endpoints, same envelopes, same UUID schema.

## Capabilities

### New Capabilities
<!-- none — pure cleanup, no behavior change -->

### Modified Capabilities
<!-- none — pure cleanup, no behavior change -->

## Impact

- **Backend:** `src/Repositories/*` (delete or fix), `AuthService.php`, `UserService.php`, `swagger/openapi.yaml`, `tests/`.
- **Web/App:** none expected (audit shows clean); only touch if stragglers found.
- **Risk:** low. Deleting dead code; live paths covered by existing smoke (signup/login/post/feed verified on fresh schema).
