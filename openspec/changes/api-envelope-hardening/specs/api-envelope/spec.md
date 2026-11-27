# Spec Delta

## Purpose

Guarantees that every backend endpoint returns a consistent JSON envelope with correct HTTP status, so the web client can reliably parse responses and surface real errors instead of the blank 200 seen on profile view.

## ADDED Requirements

### Requirement: Envelope shape
Every API response SHALL be `Content-Type: application/json` with body `{"success": bool, "data": any|null, "error": string|null}` where `success===true` implies `error===null` and `success===false` implies `data===null`.

#### Scenario: Success envelope
- **WHEN** `GET /user/view?user_id=alice` finds the user
- **THEN** the response is `200` with `{"success":true,"data":{"user_id":"alice",…},"error":null}` and `Content-Type: application/json`

#### Scenario: Error envelope
- **WHEN** `GET /user/view?user_id=missing` finds no user
- **THEN** the response is `404` with `{"success":false,"data":null,"error":"User not found"}`

### Requirement: Status codes match envelope
The system SHALL use `200`/`201` for success, and `400`/`401`/`403`/`404`/`409`/`422`/`429`/`500` for errors, with `success` consistent with the code (`2xx` → true, `4xx/5xx` → false).

#### Scenario: Auth missing uses 401
- **WHEN** a protected endpoint receives no Bearer token
- **THEN** it returns `401` with `{"success":false,"error":"Missing authorization token"}`

#### Scenario: Rate limited uses 429
- **WHEN** login is rate-limited
- **THEN** it returns `429` with `error` containing retry guidance and `retry_after_seconds` in data/details

### Requirement: No raw output before envelope
The system SHALL never emit `echo`, `var_dump`, or PHP warnings/notices before the JSON envelope, and SHALL funnel all throwables through `ResponseFormatter::handleError` so a failing endpoint still returns the envelope.

#### Scenario: PHP warning does not break JSON
- **WHEN** an endpoint triggers a PHP warning
- **THEN** the response is still parsable JSON with `success`/`data`/`error` and appropriate status

### Requirement: UTF-8 safety
The system SHALL encode JSON with `JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR` so legacy rows with malformed bytes do not produce an empty 200 body.

#### Scenario: Malformed bytes handled
- **WHEN** a row contains invalid UTF-8
- **THEN** the response still returns `200` with a valid envelope containing substituted characters

### Requirement: Empty data distinction
For fetch-by-id endpoints (`user/view`, `place/get`, `activity/get`, `post/list` with id), a missing entity SHALL be an error envelope (`404`) not `200` with `data:null` and `success:true`.

#### Scenario: Missing place returns 404
- **WHEN** `GET /place/get?place_id=999999` finds nothing
- **THEN** it returns `404` with `{"success":false,"error":"Place not found"}` not `200` with `success:true`

### Requirement: Audit coverage
The system SHALL have contract tests covering every route in `backend/public/index.php` route table for success and error envelope shape, including malformed JSON input.

#### Scenario: Contract test catches regression
- **WHEN** any route returns HTML or missing envelope keys
- **THEN** the contract test fails
