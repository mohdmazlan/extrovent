# Proposal

## Why

Profile `view?user_id=haleqq123` returned `HTTP 200 0.3kB` but `extrovent_web/src/lib/apiClient.ts:76` threw `Invalid server response (HTTP 200)` (`Profile not found` in screenshot), confirming the backend broke the `{success, data, error}` envelope contract that `ResponseFormatter.php:73` is supposed to guarantee. With 30+ routes in `backend/public/index.php:99` (`auth/signup`, `user/profile`, `post/list`, etc.) any single endpoint emitting HTML warnings, empty output, `echo` before `header`, or `success:true` with `null` data will break every page. A systematic envelope audit is blocking before the new shell/profile features are usable.

## What Changes

- **Contract audit:** Inventory every route in `backend/public/index.php:99` + `ResponseFormatter.php:73` and verify each returns `Content-Type: application/json` + `{"success":bool,"data":..., "error":string|null}` with correct `http_response_code` (200/201 for success, 400/401/403/404/409/422/429/500 for errors), never raw `echo`, `var_dump`, or PHP warnings before JSON.
- **Envelope hardening:** Ensure `ResponseFormatter::send()` always runs (`exit` after `json_encode` with `JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR` already at `php:87`), add global `set_exception_handler`/`set_error_handler` that funnels through `handleError` so fatal warnings become `{"success":false,"error":...}` not HTML, and suppress `display_errors` in prod.
- **Status correctness:** Fix known mismatch where a missing user returns `200` with `success:true` + `data:null` (screenshot) — must be `200→success:true` only when data present or `404` with `{"success":false,"error":"User not found"}` for `user/view`, `place/get`, `activity/get`, etc. Audit `UserService/AuthService/PostService/PlaceService` for `fetchOne` null → error vs success.
- **Consistency:** Normalize envelope keys across all services: `success` boolean (not `status`), `data` (null on error), `error` string (null on success). Remove legacy branches that `echo json_encode` directly.
- **Observability:** Add contract tests (`backend/tests/ContractTest.php` + `extrovent_web/src/lib/apiClient.test.ts:76` envelope cases) that hit each route with bad input and assert envelope shape and `Content-Type`.

## Capabilities

### New Capabilities
- `api-envelope`: Backend JSON envelope contract — every endpoint returns `{"success","data","error"}` with correct HTTP status and `application/json` header, never raw output.

### Modified Capabilities
- `user-auth`: Tighten auth error responses to envelope (401 `Missing authorization token`, 429 `retry_after_seconds`) without breaking existing Bearer flow.

## Impact

- **Backend:** `backend/src/Middleware/ResponseFormatter.php:73` (`send` + `handleError`), `backend/public/index.php:99` (route table ensure every branch calls `$response->success|error` + `send()`), `backend/src/Services/*` (UserService, AuthService, PostService, PlaceService, ActivityService, etc.) error vs success mapping, `backend/.env` `APP_DEBUG`/`display_errors` handling, new `backend/tests/ContractTest.php`.
- **Web:** `extrovent_web/src/lib/apiClient.ts:76` `parseEnvelope` (keep as oracle, add `error.data` logging for malformed), optional small `apiClient.test.ts` envelope cases. No UI change.
- **Ops:** No new deps; purely correctness — fixes the 0.3kB 200-but-invalid that currently bricks `ViewProfilePage` and `Feed` profile links.
