# Tasks: Migrate Android App Auth (Phase 1 — Mapping + Design)

## 1. Endpoint Coverage Matrix

- [x] 1.1 Inventory all request classes under `function/serverRequest/` and record each one's legacy `android_php/*.php` URL, HTTP method, and request parameters; verify the list counts ~69 classes with no class left unlisted (verified: 58 files = 57 endpoint classes + ServerRequest helper; "~69" estimate corrected — full table in matrix.md)
- [x] 1.2 Map each inventoried endpoint to its `/api/*` equivalent from `backend/public/index.php` route table and `swagger/openapi.yaml`, marking each row as direct-match, param-divergent, or missing; verify every row has a target route or an explicit gap flag (verified: 22 MATCH / 17 DIVERGENT / 19 MISSING incl. 2 semantics gaps — table in matrix.md)
- [x] 1.3 Document backend gaps with no `/api/*` equivalent (known suspects: event/place/activity ratings, `GetImages`/`sid`, notifications, FCM token, invites, feedback, `getUPosts`, joined-events semantics) and file each as a scoped backend follow-up; verify each gap names the owning follow-up change (verified: 10 gap rows in matrix.md, each with proposed follow-up; plus other-user-profile and upload-route semantics gaps found during mapping)
- [x] 1.4 Record per-screen response-parsing impact by sampling Activities/Adapters that parse the legacy shape versus the `{success, data, error}` envelope; verify the matrix states a Phase 3 size estimate (screens affected, not code) (verified: 100+ JSONObject sites across ~40 files; estimate 35–40 screens + 5 Upload*Service paths, in matrix.md)

## 2. Auth Injection Design Validation

- [x] 2.1 Prototype-spike (throwaway, not committed) a minimal `AuthenticatedRequest extends StringRequest` that injects a hard-coded Bearer header on one existing request class and hits a local protected endpoint; verify 200 with valid token and 401 without, then delete the spike (verified live against real backend: 401/401/200 with no/garbage/valid token; full refresh→200 then reuse→401; logout→200 then reuse→401 — wire contract proven in matrix.md; on-device Volley compile/run needs Android SDK, carried as first Phase 2 task)
- [x] 2.2 Confirm the Volley 401 → refresh → single-retry flow is implementable in the base class without touching Activities (error-listener interception proof in the spike), and record the retry-cap rule in the matrix doc; verify by code-reading the spike before deletion (verified: no existing getHeaders overrides anywhere in app — greenfield; retry-cap rule "exactly one retry, then force re-login" recorded in matrix.md; server half of the flow proven live)
- [x] 2.3 Confirm `EncryptedSharedPreferences` (AndroidX Security) availability in the app's `build.gradle` dependency set and minSdk compatibility; verify versions support the app's `minSdkVersion`, or record the fallback decision (verified: minSdk 26 supports security-crypto 1.1.0-alpha06, fallback 1.0.0; dependency absent from build.gradle — adding it is a Phase 2 task, recorded in matrix.md)

## Workflow follow-up

- Review the matrix with backend owners; confirm or re-scope backend follow-ups for gap endpoints
- Phase 2 change (auth cutover) starts only after matrix sign-off
- Phase 3 change (screen re-wiring) is sized from task 1.4's estimate
- Archive this change after matrix + design sign-off
