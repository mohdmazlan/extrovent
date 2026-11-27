# Design

## Context

All 57 classes in `function/serverRequest/` extend Volley `StringRequest`, build URLs as `new OutdoorBuddy().root + "android_php/<x>.php"`, POST form params including `user_id`/`login_key`, and parse legacy flat JSON per screen. `Session` persists `user_id` + `login_key`; `LoginActivity` parses `login_key`; `OutdoorBuddy.root` is already `https://extrovent.mikael.my/api/` with a dead `ipAddress` field beside it. Backend is Bearer-only with a `{success, data, error}` envelope; the Phase 1 matrix (`migrate-android-app-auth`, archived) maps every class to a `/api/*` target.

## Goals / Non-Goals

**Goals:**
- One shared auth mechanism so the 57 classes never touch tokens.
- Login, register (+ auto-login), logout, and startup routing work against `/api/*`.
- No screen behavior changes in this slice beyond auth.

**Non-Goals:**
- Remapping the other 55 endpoint classes and screen response parsing (later phases).
- The 19 endpoints with no backend route (ratings, notifications, invites, feedback, FCM, `GetImages`, cross-user profiles).
- Debug-build URL overrides (release decision only; debug follows the same constant unless a later change says otherwise).

## Decisions

- **Shared `AuthenticatedRequest extends StringRequest` base class** (not per-class `getHeaders()` overrides): injects `Authorization: Bearer <access_token>`, unwraps the envelope into a single error shape, and owns the 401 → refresh-once → retry-once → wipe-and-login loop. Alternative (per-class overrides) rejected: 57 copies of the refresh loop.
- **Token split (memory + prefs)**: access token in a static in-memory holder (mirrors web `apiClient`), refresh token + `user_id` in the existing `login_details` SharedPreferences. Process death recovers via silent refresh on the next call; no blocking validation call at startup.
- **Envelope unwrapping in the base**: transport errors (VolleyError) and envelope errors (`success:false`) converge to one failure callback carrying the server message, so later screen rewiring is mechanical. Login/register/logout stay outside the base (unauthenticated calls).
- **Keep `root + <path>` construction**: each class keeps building its URL from `OutdoorBuddy.root`; only the suffix changes per the matrix. `root` stays a hardcoded production constant; `ipAddress` and its commented history are deleted.
- **Register maps `pass1/pass2` to `password/confirm_password`** and auto-logs-in on success, matching the web client.

## Risks / Trade-offs

- Screens that branch on 401 or parse `"login"` strings may misbehave until their phase; the base class cannot fully shield legacy parsing from envelope changes on non-auth endpoints (out of scope here).
- In-memory access token means every cold start costs one refresh call; acceptable (same as web hard-reload).
- `new OutdoorBuddy().root` (manual `Application` instantiation in 57 classes) is left as-is; centralizing it is a later cleanup, not a behavior change.
