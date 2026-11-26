# Proposal

## Why

The Android app (`extrovent_app/`) still talks exclusively to the legacy `android_php/*.php` endpoints, which no longer exist in the deployed backend. It has never sent a Bearer token and parses the legacy response shape, so it cannot work against the current backend at all. The 69 request classes, ~93 call sites, and every screen's response parsing all assume the old API.

## What Changes

Phased migration of the Android client onto the Bearer-token backend:

- **Phase 1 (this change): endpoint mapping + auth design.** Produce a complete matrix of all 69 app request classes against current `/api/*` routes, marking gaps (ratings, `GetImages`/`sid`, notifications, FCM token, invites, feedback) and response-shape divergences per screen. Decide the auth injection design: a shared `AuthenticatedRequest` base class (injects `Authorization: Bearer` header, centralizes 401-refresh handling) versus per-class `getHeaders()` overrides.
- **Phase 2 (later change): auth cutover.** Retarget base URLs, rewrite `Session` to store tokens, rewrite `LoginActivity` parsing, add refresh-on-401, logout, and startup validation.
- **Phase 3 (later change): screen-by-screen response re-wiring.** Migrate every Activity/Adapter to the `{success, data, error}` envelope. Sized by the Phase 1 matrix.

## Capabilities

### New Capabilities

- `android-auth`: Android client authentication against the Bearer-token backend — token storage, header injection, refresh-on-401, logout, and startup session validation.

### Modified Capabilities

<!-- None — backend requirements are unchanged; this change covers client behavior only. -->

## Impact

- Affected code (later phases): `extrovent_app/app/src/main/java/com/ums/outdoorbuddy/function/serverRequest/*` (69 classes), `Session.java`, `LoginActivity.java`, `OutdoorBuddy.java`, ~30 Activities/Adapters/Fragments response parsing.
- No backend changes expected; Phase 1 may surface missing `/api/*` endpoints, which would become backend follow-ups.
- Deploy coordination: app and backend already diverged (backend is Bearer-only); the app must be updated before it can work at all — there is no shared backward-compatible mode for the legacy `android_php` paths.
