# Spec Delta

## Purpose

Provides identifier-based authentication (email or username, no merchant tenant) with correct Bearer handling, queued 401 refresh, and local expiry checks as proven in the merpati messenger.

## ADDED Requirements

### Requirement: Identifier-Based Login
The system SHALL accept `identifier` (email or `@`-optional username, case-insensitive) plus `password` at `POST /auth/login` and SHALL NOT require `merchant_code`.

#### Scenario: Login with email
- **WHEN** a user posts `{identifier:"alice@example.com", password:"secret123"}` to `/auth/login`
- **THEN** authentication succeeds with the same semantics as `merpati/backend/src/Auth/AuthController.php:109`

#### Scenario: Login with username case-insensitive
- **WHEN** a user posts `{identifier:"Alice", password:"secret123"}` where username is `alice`
- **THEN** authentication succeeds

#### Scenario: Unknown identifier rejected with specific code
- **WHEN** identifier matches no user
- **THEN** the system returns `401` with code `ACCOUNT_NOT_FOUND`

### Requirement: Registration With Username
The system SHALL accept `email, password, username, display_name` at `POST /auth/register` with the same validation as `merpati/backend/src/Auth/AuthController.php:27` (email format, password >=8, username `^[a-zA-Z0-9_]{3,30}$`).

#### Scenario: Valid registration succeeds
- **WHEN** a user posts valid email, password, username, and display_name
- **THEN** the system returns `201` with `access_token`, `refresh_token`, `expires_in`, and `user`

### Requirement: Plain Token Storage With Expiry Gate
The system SHALL persist `access_token`, `refresh_token`, and `user` in `localStorage` under those exact keys as in `merpati/web/src/contexts/AuthContext.tsx:34` and SHALL validate `exp` client-side before attaching the token.

#### Scenario: Expired token not attached
- **WHEN** stored `access_token` has `exp` in the past
- **THEN** the client does not send `Authorization` and treats the session as unauthenticated

### Requirement: Axios Auth Interceptors With Queue
The system SHALL inject `Authorization: Bearer <access_token>` on every request via a request interceptor (`merpati/web/src/api/client.ts:17`) and SHALL queue parallel 401s behind a single refresh (`isRefreshing` + `failedQueue` `merpati/web/src/api/client.ts:25`), refreshing via `POST /auth/refresh {refresh_token}` and retrying the original request with the new token.

#### Scenario: Parallel 401s share one refresh
- **WHEN** two requests receive 401 concurrently and a valid `refresh_token` exists
- **THEN** only one `POST /auth/refresh` is made and both original requests are retried with the new `access_token`

#### Scenario: Refresh failure logs out
- **WHEN** refresh returns 401 or 403
- **THEN** storage is cleared and the user is redirected to `/login`

### Requirement: Rate Limit Feedback
The system SHALL surface `429` responses from login (`RateLimiter` `merpati/backend/src/Auth/AuthController.php:124`) including `retry_after` to the caller instead of a generic message.

#### Scenario: Rate limited login shows retry delay
- **WHEN** login returns 429 with `retry_after`
- **THEN** the client surfaces the delay to the user
