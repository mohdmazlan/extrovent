# Tasks

## 1. DB baseline and migration

- [x] 1.1 Single `backend/database/schema.sql` is the complete schema (all 33 tables: `users` UUID PK + `user_credentials` + session tables, no `user_details`, all FKs `CHAR(36)`); verified no `user_details` refs
- [x] 1.2 No ALTER migrations remain (`migrations/` file removed); `migrate.php` imports `schema.sql` in 1 go when `users` is missing, safe no-op otherwise
- [x] 1.3 Verify fresh DB: `php migrate.php --fresh` → 33 tables, `users` has `id, username, email, first_name, last_name, no_phone` and no `password`, `user_details` gone; re-run reports already-initialized

## 2. Backend API — auth and profile

- [x] 2.1 Update `backend/src/Services/AuthService.php` to lookup `users` by `username`/`email` (`identifier` param, `LOWER` match), fetch `password_hash` from `user_credentials` by `users.id` UUID, generate JWT `sub = users.id`, add `PUT /user/password` reuse check (`password_verify(new, current_hash)` → 400, `updated_at` is last change), and verify `POST /auth/login` with `username` returns `id` UUID and reused password is rejected
- [x] 2.2 Update `backend/src/Services/UserService.php` to make `GET /user/profile` single-table `SELECT * FROM users WHERE id = ?` and `PUT /user/update` single-table `UPDATE users SET ... WHERE id = ?` for `nickname, email, first_name, last_name, no_phone`, and verify `php -l` clean and `PUT /user/update` persists without touching `user_details`
- [x] 2.3 Update all `*_Service.php`/`*_Repository.php` that store or query `user_id` FK (`PostService`, `PlaceService`, `EventService`, `ActivityService`, `FriendService`, `ChatroomService`, `BusinessProfileService`) to accept and store `CHAR(36)` UUID, and verify `php -l` clean and `INSERT INTO posts (user_id)` with UUID succeeds

## 3. Web — login and profile

- [x] 3.1 Update `extrovent_web/src/lib/users.ts` `UserProfile` to include `id` UUID and `username`, remove `department_id` remnants, and update `extrovent_web/src/pages/ProfilePage.tsx` to 5 fields `nickname/email/first_name/last_name/no_phone` with `username` display, and verify `npm run build` succeeds
- [x] 3.2 Update `extrovent_web/src/auth/AuthContext.tsx` and `src/lib/apiClient.ts` login to send `username` (keep `identifier` fallback for one release) and store `id` UUID as `sub`, and verify `POST /auth/login` with `username` logs in and `GET /user/profile` shows `first_name` from `users`

## 4. App — Android identity

- [x] 4.1 Update `extrovent_app/app/src/main/java/com/ums/outdoorbuddy/OutdoorBuddy.java`, `AboutActivity.java`, `ViewProfileActivity.java`, `Session`, and `List*` adapters to use `username` for login/display and `id` UUID as stable FK, remove `no_ic`/`no_matrik`/`department_id` remnants, and verify `:app:assembleDebug` succeeds
- [x] 4.2 Verification: fresh DB + backend + web + app smoke — `php migrate.php` fresh (baseline + 1), `POST /auth/login` with `username` (JWT sub UUID), `POST /post/create` with UUID FK, feed join returns `username`, `GET /user/profile` single-table, web `npm run build` OK, app `:app:assembleDebug` OK, no `user_details` table

## Workflow follow-up

- Archive the change after review with `/opsx-archive db-user-identity-split`
- Verify archived specs appear in `openspec/specs/user-identity`, `user-auth`, `android-auth`
