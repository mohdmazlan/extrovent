# Design

## Context

See proposal.md - Why. Today `CreateUserPostActivity:109,218,332` and `AboutActivity:188,234` use `Toast(e.toString())` for JSON/IO failures, `OutdoorBuddy:81` swallows Volley errors, and `ErrorListener` is often `null` so 401/413 from `CreatePost`/`UpdateProfilePic` (Base64 100% JPEG) never surfaces. Post + profile appear "cannot" with stuck `ProgressDialog`.

## Goals / Non-Goals

**Goals:**
- One Logcat tag `outdoorbuddy` for all post/profile flows, user sees `Snackbar` "Failed: check connection / too large / not logged in", dev sees `req url + status + body`.
- Remove ~40 debug Toasts, keep ~10 user Toasts.

**Non-Goals:**
- No API contract change, no Media3, no Kotlin, no new permissions.

## Decisions

- **Central `AppLog + VolleyQueue`:** singleton `Volley.newRequestQueue(appContext)` + wrapper `logRequest(tag, url, params)` / `logResponse(tag, code, body)` vs per-screen queue — reduces queues and gives one filter `adb logcat -s outdoorbuddy:D`.
- **Separate UI vs debug error:** `UiError` -> `Snackbar`/`AlertDialog`, `DebugError` -> `Log.e(TAG, msg, e)` gated by `BuildConfig.DEBUG` for verbose body. Alternative plain Toast kept for perf — rejected, Toast hides behind other UI.
- **Keep `ProgressDialog` dismiss in `finally`:** ensure `dismiss()` on both `onResponse` and `onError` to avoid stuck dialog that looks like "cannot post".

## Risks / Trade-offs

- [Risk] Stripping Toasts removes crutch devs rely on -> Mitigation: keep `Log.e` with `requestId` and add `docs/debugging.md` one-liner `adb logcat -s outdoorbuddy:D`.
- [Risk] Base64 100% JPEG may be 413 after BOM bump -> Mitigation: log `payloadBytes` length, recommend `compress 70` if >1MB (no auto-change here).

## Migration Plan

1. Add `AppLog.java` + `VolleyQueue.java`, replace debug Toasts in `CreateUserPostActivity`/`AboutActivity`.
2. Re-run `createPost` + `EdittextDialog` + avatar upload, verify `logcat` shows `CreatePost 200 {"success":false}` vs `onError 401` and UI shows correct message.
3. Rollback: `git checkout -- CreateUserPostActivity.java AboutActivity.java`.

## Open Questions

- Do `CreatePost`/`UpdateProfilePic` now require `Authorization: Bearer` after `android-auth-spine`? If yes, log will show `401` and next change adds header — defer here.
