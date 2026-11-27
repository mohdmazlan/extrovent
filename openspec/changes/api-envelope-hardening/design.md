# Design

## Context

Web `apiClient.ts:76` `parseEnvelope` expects `{"success":bool,"data","error"}` but `view?user_id=haleqq123` returned `200 0.3kB` that failed `res.json()` (screenshot `Invalid server response (HTTP 200)`), proving `backend/public/index.php:99` can emit non-JSON or `200` with `success:true` + `data:null` for a missing user. `ResponseFormatter.php:73` already promises the envelope but plain `echo` or PHP warnings before `header` break it. See proposal for why.

## Goals / Non-Goals

**Goals:**
- Make every route go through `ResponseFormatter` (`success`/`error`/`send`) and never emit raw output.
- Ensure missing-entity is `404` envelope, not `200` + null (clients treat null as error but `success:true` is wrong).
- Keep fix safe — no route rename, no new dependency.

**Non-Goals:**
- Changing data shapes inside `data` (e.g., user fields).
- Adding auth logic beyond envelope correctness.

## Decisions

**1. Centralize through `ResponseFormatter::send()` only.**
Route table already forces `success`/`error` then `send()` with `exit`; audit each `Services/*` to return `array|null` and let `dispatch` decide status, rather than `echo json_encode` inside services. Alternative: add per-service header — rejected; single choke point guarantees `Content-Type` and `json_encode` flags.

**2. Global error/warning handler.**
Register `set_exception_handler` + `set_error_handler` in `public/index.php` that forwards to `ResponseFormatter::handleError` with `APP_DEBUG` flag (`ResponseFormatter.php:46`). Converts warnings (`json_encode` failure, undefined index) from HTML to `{"success":false,"error":"Internal server error"}` 500. Alternative: silence warnings — hides bugs.

**3. Fix `200 + data:null` → `404` for fetch-by-id.**
Services returning `fetchOne` null currently do `return null` → dispatch does `$response->success(null)` → `200 success:true`. Change to `throw new NotFoundException("User not found")` → `handleError` maps to `404 success:false`. Covers `user/view`, `place/get`, `activity/get`, `event/get`. Alternative: keep `200 null` and make web handle it — rejected; envelope contract says `404` for missing.

**4. Keep `JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR` already at `ResponseFormatter.php:87`.**
No change needed; ensures legacy rows don't produce empty body. Verify via test inserting malformed byte.

**5. Contract tests in both layers.**
Backend `tests/ContractTest.php` hits each entry in `$routes` with bad input (missing user, bad token) and asserts `Content-Type: application/json` and envelope keys + status. Web `apiClient.test.ts` keeps `parseEnvelope` as oracle (already tests 429 envelope). Alternative: only manual curl — misses regressions.

## Risks / Trade-offs

- **Changing `200 null` → `404` is technically breaking for any client that trusted `200`:** Mitigation: web already treats `null` as error (`Invalid server response`) — `404` with clear `error` is more correct and `apiClient.ts:76` already maps `success:false` → `ApiError` regardless of HTTP code.
- **`display_errors` leaking HTML before JSON:** Mitigation: set `ini_set('display_errors',0)` in prod and ensure `handleError` sets header first.
- **UTF-8 substitution hides data corruption:** Mitigation: log `json_last_error()` when substitution occurs; don't fail the response.

## Migration Plan

1. Patch `ResponseFormatter` (`display_errors` + handlers) — safe, additive.
2. Patch missing-entity services to throw `NotFoundException` (404) — verify screenshot `haleqq123` now returns `{"success":false,"error":"User not found"}` and `ViewProfilePage` shows `Profile not found` correctly.
3. Add contract tests; run `phpunit` and `npm test`; deploy.

## Open Questions

- Should `GET /search` with empty query return `200 {data:[]}` vs `400`? Keep `200 []` for now — no spec change needed.
