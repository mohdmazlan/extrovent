# Proposal

## Why

The Android app (`extrovent_app/`) still speaks the legacy protocol exclusively: 57 Volley request classes POST to `android_php/*.php` with `user_id`/`login_key`, and `Session` stores a `login_key` the Bearer-only backend no longer accepts. The app cannot log in or call any endpoint until an auth spine (token storage, header injection, refresh, logout, startup check) exists. This is the hinge for the whole client cutover: everything else stays broken without it, and everything after it becomes mechanical.

## What Changes

- **BREAKING**: `OutdoorBuddy.root` stays `https://extrovent.mikael.my/api/`; the `ipAddress` field and its commented-out history are removed. Release builds point at production with no IP-switching UI.
- `Session` stores `access_token` (memory) + `refresh_token` (persisted) + `user_id` instead of `login_key`; `getLogin_key()` is removed and its readers (`LoginStatus`, `OutdoorBuddy.getLoginKey`) are updated.
- New shared `AuthenticatedRequest` base class: injects `Authorization: Bearer`, unwraps the `{success, data, error}` envelope into one error shape, and on 401 refreshes once via `/auth/refresh`, retries once, else wipes tokens and routes to login.
- `LoginActivity` parses `data.access_token / refresh_token / user_id` (no `login_key`); `RegisterActivity` sends `password`/`confirm_password` and auto-logs-in on success (same as web).
- Logout calls `POST /api/auth/logout` when online, always clears local tokens; startup routes to login when no tokens exist, else proceeds and lets the first call prove the session.

Out of scope: remapping the remaining 55 endpoint classes and all screen response parsing (later phases); the 19 endpoints with no backend route (ratings, notifications, invites, feedback, FCM, `GetImages`, cross-user profiles) — product decision pending, classes left untouched.

## Capabilities

### New Capabilities

<!-- None — the android-auth capability already exists. -->

### Modified Capabilities

- `android-auth`: token storage split (access in memory, refresh persisted), release base-URL requirement, and registration-with-auto-login requirement.

## Impact

- Affected code: `Session.java`, `LoginActivity.java`, `RegisterActivity.java`, `OutdoorBuddy.java` (root/login_key readers), `LoginStatus`/`LoginStatusRequest` (login_key params), one new `AuthenticatedRequest` class. No other screen behavior changes in this slice.
- No backend changes. Backend `user-auth` requirements untouched.
- Follow-ups: core-screen rewiring, then the long tail + missing-endpoint product calls.
