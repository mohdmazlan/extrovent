# Tasks

## 1. Token storage (Session)

- [x] 1.1 Rewrite `Session.login()` to store `access_token` (in-memory holder) + `refresh_token` + `user_id` (SharedPreferences); drop `login_key`
- [x] 1.2 Remove `getLogin_key()`; update readers in `LoginStatus.java` and `OutdoorBuddy.getLoginKey()` (logout path clears tokens instead)
- [x] 1.3 Verify no remaining `login_key` references in `extrovent_app/` (grep)

## 2. Shared request base

- [x] 2.1 Create `AuthenticatedRequest extends StringRequest`: Bearer header injection from session holder
- [x] 2.2 Unwrap `{success, data, error}` envelope into a single success/failure callback carrying the server message
- [x] 2.3 Implement 401 → `POST /api/auth/refresh` once → retry original once → else wipe tokens and route to `LoginActivity` (never loop)

## 3. Login / register / logout / startup

- [x] 3.1 Retarget `AppzLogin` to `auth/login`; parse `data.access_token / refresh_token / user_id` in `LoginActivity` (surface 401/429 server messages)
- [x] 3.2 Retarget `AppzRegister` to `auth/signup` (`password`/`confirm_password`); auto-login on success like web
- [x] 3.3 Wire logout: `POST /api/auth/logout` when online, always clear local tokens (Session + OutdoorBuddy)
- [x] 3.4 Startup routing: no tokens → login screen; tokens present → main screen, first protected call proves/refreshes the session
- [x] 3.5 Remove `ipAddress` field and commented history from `OutdoorBuddy.java`; keep `root` as the production constant

## 4. Verify

- [x] 4.1 Grep screens for branches on 401/`"login"` strings that could misbehave before their phase (record, do not fix)
- [ ] 4.2 Manual pass: fresh install → register → auto-login → kill process → relaunch (silent refresh) → logout → login with wrong password (error shown)
- [x] 4.3 `openspec validate --change "android-auth-spine"` passes
