# Proposal

## Why

Posting and profile edit fail silently behind 100+ debug Toasts (`CreateUserPostActivity:109 HELLO`, `AboutActivity:188 e.toString`). Users see stuck dialogs, devs see no actionable logs, so both flows are undebuggable after the auth/BOM bump.

## What Changes

- Remove debug Toats from `CreateUserPostActivity`, `AboutActivity`, `HomeFragment`, `OutdoorBuddy/Session` and replace with user-facing messages + Logcat.
- Centralize Volley error handling (single queue, `Response.ErrorListener` that logs `statusCode + body + url`) and stop swallowing `JSONException`/`IOException` with `e.toString()` Toasts.
- Add a teachable debug path: `adb logcat -s outdoorbuddy:D` filter, optional `BuildConfig.DEBUG` overlay, no Toast to hunt.

## Capabilities

### New Capabilities
- None — UX/logging refactor, no new product behavior.

### Modified Capabilities
- None — no spec-level requirement change. This change sets `skip_specs: true` in `.openspec.yaml`.

## Impact

- Affected: `extrovent_app/app/src/main/java/com/ums/outdoorbuddy/{CreateUserPostActivity,AboutActivity,fragment/HomeFragment,fragment/ProfileFragment,OutdoorBuddy,function/*}.java`, `styles/layout not touched`.
- No API or auth contract change; just surfaces the real 401/413/500 errors that currently hide behind Toats. Rollback: revert log/handler edits.
