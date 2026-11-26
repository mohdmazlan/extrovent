# Android Authentication Specification

## Purpose

Defines how the Android client authenticates against the Bearer-token backend, covering token storage, header injection on every protected call, refresh-on-expiry, logout, and startup session validation.

## Requirements

### Requirement: Token-Based Login
The app SHALL authenticate via `POST /api/auth/login` with `user_id` and `password`, and persist the returned `access_token`, `refresh_token`, and `expires_in` in place of the legacy `login_key`.

#### Scenario: Successful login stores tokens
- **WHEN** the user logs in with valid credentials
- **THEN** the app stores the access and refresh tokens and navigates to the main screen without storing any `login_key`

#### Scenario: Failed login surfaces the server message
- **WHEN** the server rejects credentials with 401 or rate-limits with 429
- **THEN** the app displays the server-provided message, including attempts-remaining warnings and retry-after guidance

### Requirement: Bearer Header on Protected Calls
Every request to a protected `/api/*` endpoint SHALL carry an `Authorization: Bearer <access_token>` header. No request SHALL send `user_id` as a substitute credential or include a `login_key` parameter.

#### Scenario: Authenticated request carries the header
- **WHEN** the app calls any protected endpoint with a valid stored access token
- **THEN** the request includes the Bearer header and succeeds without credential query parameters

### Requirement: Silent Refresh on Expiry
When a protected call receives 401 due to an expired access token, the app SHALL use the stored refresh token at `POST /api/auth/refresh` to obtain a new pair, persist it, and retry the original request once before surfacing any error.

#### Scenario: Expired token refreshes transparently
- **WHEN** a protected call returns 401 for an expired (not revoked) token and a valid refresh token exists
- **THEN** the app refreshes, retries the original call, and the user sees no interruption

#### Scenario: Revoked session forces re-login
- **WHEN** refresh is rejected with 401 (revoked or expired refresh token)
- **THEN** the app clears stored tokens and returns the user to the login screen

### Requirement: Logout Revokes Server-Side
Logging out SHALL call `POST /api/auth/logout` with the current access token before clearing local token storage.

#### Scenario: Logout ends the server session
- **WHEN** the user logs out with network available
- **THEN** the app calls the logout endpoint and then clears stored tokens

#### Scenario: Offline logout still clears locally
- **WHEN** the user logs out without network access
- **THEN** the app clears stored tokens locally so no stale token remains on device

### Requirement: Startup Session Validation
On launch, the app SHALL check for stored tokens: if none exist, show login; if an access token exists, proceed and let the first protected call (with silent refresh) prove validity rather than blocking on a dedicated check.

#### Scenario: Fresh install shows login
- **WHEN** the app launches with no stored tokens
- **THEN** the login screen is shown

#### Scenario: Stored session resumes
- **WHEN** the app launches with stored tokens
- **THEN** the main screen is shown and the first protected call validates or refreshes silently

### Requirement: Endpoint Coverage Matrix
Before cutover, a complete matrix SHALL map every legacy `android_php/*.php` call used by the app to its `/api/*` equivalent, explicitly marking endpoints with no backend equivalent and response-shape divergences per screen.

#### Scenario: Matrix gates the cutover
- **WHEN** reviewers check migration readiness
- **THEN** every one of the ~69 request classes has a row stating its target route, gap status, and parsing impact