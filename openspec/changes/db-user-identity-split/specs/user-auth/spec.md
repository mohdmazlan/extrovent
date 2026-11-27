# Spec Delta

## MODIFIED Requirements

### Requirement: Rate Limiting on Login
The system SHALL limit login attempts to 5 per 15 minutes per IP address and per identifier (`username` or `email`). After exceeding the limit, the client MUST receive a 429 Too Many Requests response with retry-after information. The identifier for rate limiting SHALL be the normalized `username`/`email` from `users`, not the stable `id`.

#### Scenario: Normal login attempts succeed
- **WHEN** user makes fewer than 5 failed login attempts within 15 minutes for a given `username`/`email`
- **THEN** authentication proceeds normally

#### Scenario: Exceeded rate limit blocks login
- **WHEN** user exceeds 5 failed login attempts within 15 minutes for that identifier
- **THEN** system returns 429 with retry_after_seconds in response body

### Requirement: Login Response Contains Only JWT Tokens
The login endpoint SHALL return only JWT access token and refresh token plus `id` (UUID), `username`, `nickname`, `email`, `avatar`. The response MUST NOT include a legacy `login_key` field and MUST NOT return `password` or `password_hash`.

#### Scenario: Successful login returns JWT tokens
- **WHEN** user provides valid credentials (`username` or `email` + `password`) to /auth/login
- **THEN** system returns `id` (UUID `users.id`), `username`, `access_token`, `refresh_token`, `token_type`, `expires_in`

### Requirement: Token Validation Includes User Existence Check
The authentication middleware SHALL verify that the authenticated user still exists in the database on each request by checking `users.id = sub` (UUID). If the user has been deleted, access MUST be denied regardless of token validity.

#### Scenario: Active user can access protected endpoints
- **WHEN** user with existing `users.id` makes authenticated request with valid Bearer token where `sub` is that UUID
- **THEN** request proceeds normally

#### Scenario: Deleted user is denied access
- **WHEN** user whose `users.id` row was deleted makes authenticated request
- **THEN** system returns 401 Unauthorized with "user not found" message

### Requirement: JWT Access Token Generation
The system SHALL generate a short-lived JWT access token upon successful login. The token MUST contain `sub` as `users.id` UUID (CHAR36, not `username`), `roles`, `iat`, `exp`, and a unique `jti` claim. Tokens SHALL expire after 24 hours by default. The `sub` SHALL be the stable `id`, so a `username` change does not invalidate existing tokens.

#### Scenario: Successful login returns JWT
- **WHEN** user provides valid credentials (`username` or `email` and `password`)
- **THEN** system returns an `access_token` where `sub` is the `users.id` UUID and `expires_in` is set

#### Scenario: Token contains required claims
- **WHEN** a valid access token is generated
- **THEN** it MUST contain `sub` (UUID `users.id`), `iat`, `exp`, `roles`, and a unique `jti` claim

### Requirement: Session Tracking
The system SHALL create a session record on successful login containing `user_id` as `users.id` UUID (CHAR36), `ip_address`, `device_info`, `login_time`, and `status`. Sessions MUST be automatically revoked on logout or token refresh. `last_activity_at`/`expires_at` logic is unchanged, but `user_id` is UUID.

#### Scenario: Session created on login
- **WHEN** user successfully logs in with `username`
- **THEN** a new session record is created with `user_id = users.id` UUID, IP, device info, and timestamp

#### Scenario: Session revoked on logout
- **WHEN** user calls /api/auth/logout
- **THEN** the session status changes to revoked and token is blacklisted

## ADDED Requirements

### Requirement: Password change blocks immediate reuse
The system SHALL reject a password change when the new password equals the current `password_hash` in `user_credentials` (checked via `password_verify`). `user_credentials.updated_at` SHALL be the last change timestamp; no separate `password_changed_at` and no `password_history` table for now (Option A).

#### Scenario: Reuse of current password is rejected
- **WHEN** an authenticated user tries to change password to the same value as the current one
- **THEN** the system returns 400 with "cannot reuse current password" and does not update `user_credentials`

#### Scenario: New password is accepted
- **WHEN** the new password is different from the current one
- **THEN** the system hashes it, updates `user_credentials.password_hash`, and `updated_at` advances
