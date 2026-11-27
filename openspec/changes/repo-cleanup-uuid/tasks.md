# Tasks

## 1. Confirm dead code

- [x] 1.1 Confirm `backend/src/Repositories/*` is unreachable (no route resolves a Repository, `Container::resolve` never called with one) by grepping `resolve(` call sites, and verify with `php -l` that nothing else imports them
- [x] 1.2 Decide per file: delete `Repositories/*` if dead, or align joins to `u.id` if anything needs them, and verify `php -l migrate.php` plus a fresh `php migrate.php --dry-run` still passes

## 2. Strip legacy fallbacks in live Services

- [x] 2.1 Remove the `hasColumn(users,user_id)` legacy branch in `AuthService::findUserByIdentifier` and the `user_details` merge in `UserService::getProfile` plus the old-`user_id` fallback in `viewUser`, and verify `php -l` clean plus login/profile smoke still passes on a fresh DB
- [x] 2.2 Verify `swagger/openapi.yaml` documents `username`/`identifier` login (not `user_id`) and `backend/tests/` + `migrate_auth.php` don't assume the old shape, updating any stale references found

## 3. Final verification

- [x] 3.1 Re-run fresh setup `php migrate.php --fresh` plus signup/login/post/feed smoke, and `npm run build` in `extrovent_web`, and verify all green

## Workflow follow-up

- Archive the change after review with `/opsx-archive repo-cleanup-uuid`
