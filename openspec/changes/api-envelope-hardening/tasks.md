# Tasks

## 1. Backend envelope hardening

- [x] 1.1 Audit `backend/public/index.php:99` route table and ensure every branch calls `$response->success|error` then `$response->send()` (never raw `echo`/`var_dump`), add `ini_set('display_errors',0)` in prod and global `set_exception_handler`/`set_error_handler` that delegate to `ResponseFormatter::handleError`, and verify `Content-Type: application/json` on both success and error
- [x] 1.2 Fix fetch-by-id services to return `404` envelope on missing entity instead of `200` with `data:null`: update `UserService`/`UserRepository` `view?user_id=haleqq123`, `PlaceService::getById`, `ActivityService::getById`, `EventService::getById` to `throw new NotFoundException("... not found")` → `404 {"success":false,"error":"..."}` and verify screenshot case `haleqq123` now returns `404` not `Invalid server response (HTTP 200)`
- [x] 1.3 Verify `backend/src/Middleware/ResponseFormatter.php:73` already uses `JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR` and add `json_last_error()` logging when substitution occurs, with a test inserting a row with malformed bytes and asserting still returns valid envelope

## 2. Contract tests

- [x] 2.1 Create `backend/tests/ContractTest.php` that iterates every entry in `public/index.php` route table, hits each with bad input (missing user, bad token, empty body) and asserts `Status` in `200|201|400|401|403|404|409|422|429|500`, `Content-Type` contains `application/json`, and body has `success:bool`, `data`, `error`, and fails if HTML is returned
- [x] 2.2 Extend `extrovent_web/src/lib/apiClient.test.ts:76` with envelope cases: success true → data, success false → `ApiError` with `error` message, malformed JSON → `Invalid server response`, and verify `npm test` passes

## 3. Web tolerance and verification

- [x] 3.1 Keep `extrovent_web/src/lib/apiClient.ts:76` `parseEnvelope` as oracle but ensure `ViewProfilePage.tsx:11` distinguishes `404` envelope (`Profile not found` with `Find friends` link) from `Invalid server response`, and verify `view?user_id=haleqq123` now shows the 404 copy not the generic parse error
- [x] 3.2 Run `phpunit` in `backend` and `npm run build && npm test` in `extrovent_web`, plus manual smoke: `GET /user/view?user_id=haleqq123` returns `404 {"success":false}`, `GET /user/view?user_id=<valid>` returns `200 {"success":true}`, and Network tab no longer shows 0.3kB 200-but-invalid
