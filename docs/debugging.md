# Debugging

Use Logcat, not Toast, to diagnose post/profile failures.

## Filter

```bash
adb logcat -s outdoorbuddy:D Volley:E
```

- `outdoorbuddy` — all app flows (post, profile, load). Tag is `AppLog.TAG`.
- `Volley:E` — Volley error queue.

## Verbose bodies

Response bodies are logged via `AppLog.vBody()` and only appear in debug builds:

```java
if (BuildConfig.DEBUG) Log.d("outdoorbuddy", body);
```

Release builds log `<hidden in release>`.

## Typical look

Success:
```
D/outdoorbuddy: [CreatePost] response 200 {"success":true,"post_id":"123"}
```

Failure (server says no):
```
D/outdoorbuddy: [CreatePost] response 200 {"success":false,"error":"..."}
E/outdoorbuddy: [CreatePost] Volley error 401 body=...
```

Payload too large:
```
D/outdoorbuddy: [CreatePost] payloadBytes=1843211
```

## Where to add logs

- Use `AppLog.e("CreatePost", "failed", e)` not `Toast(e.toString())`.
- Show user `Snackbar` "Failed: check connection / too large / not logged in".
- Always `dismiss()` ProgressDialog in both onResponse and onError (finally).

## VolQueue

Use singleton to avoid leaking Activity:

```java
VolleyQueue.getInstance(context).add(request);
```

## Post + Profile quick checks

- Post: `selectedImagePaths` Base64 length logged before `UploadService3` start.
- Profile: `UpdateProfilePic` (Base64 100% JPEG) and `UpdateUserDetails` log `key=value` on success/failure.
- `OutdoorBuddy.load()` error now `AppLog.e` not Toast.
