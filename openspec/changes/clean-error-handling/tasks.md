# Tasks

## 1. Foundation

- [x] 1.1 Create `AppLog.java` (`Log.e/tag outdoorbuddy`) and `VolleyQueue.java` singleton and verify `adb logcat -s outdoorbuddy:D` shows test log
- [x] 1.2 Document `docs/debugging.md` with `adb logcat -s outdoorbuddy:D Volley:E` + `BuildConfig.DEBUG` body gate and verify file exists

## 2. Post flow

- [x] 2.1 Clean `CreateUserPostActivity.java` (remove `HELLO` `UPLOAD IMAGE` `""+e` Toasts, add `AppLog` + proper `ErrorListener`, `dismiss()` in finally) and verify `createPost` failure shows Snackbar not Toast(e)
- [x] 2.2 Add payload-size log for `selectedImagePaths` Base64 length and verify log shows bytes before upload

## 3. Profile flow

- [x] 3.1 Clean `AboutActivity.java` `uploadBanner` + `EdittextDialog` (remove `e.toString()` Toasts, add `AppLog`, keep user "Uploaded/Failed" Snackbar) and verify avatar + field edit no longer Toast the exception
- [x] 3.2 Fix `OutdoorBuddy.java:81` swallowed error to `AppLog.e` and verify `load()` failure appears in logcat

## 4. Verify

- [x] 4.1 Run `:app:assembleDebug` in `extrovent_app` and verify `BUILD SUCCESSFUL` and `grep -r Toast CreateUserPostActivity.java AboutActivity.java` shows no `e.toString()` debug Toasts
- [ ] 4.2 Manual check post + profile edit on device, capture `logcat -s outdoorbuddy` for success and 401/413, attach snippet to change

## Workflow follow-up

- Run `/opsx-apply` to implement tasks 1.1-4.2 from this change.
- Archive `clean-error-handling` after review.
