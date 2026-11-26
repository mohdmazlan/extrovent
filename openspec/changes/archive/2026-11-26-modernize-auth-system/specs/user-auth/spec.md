# Spec Delta: User Authentication

## Purpose

Provides a secure, modern authentication system using JWT tokens with rate limiting, session tracking, refresh tokens, and logout functionality. Replaces the legacy login_key-based auth.

## ADDED Requirements

### Requirement: JWT Access Token Generation
The system SHALL generate a short-lived JWT access token upon successful login. The token MUST contain user_id, roles, and expiration claims. Tokens SHALL expire after 24 hours by default.

#### Scenario: Successful login returns JWT
- **WHEN** user provides valid credentials (user_id and password)
- **THEN** system returns an access_token with user claims and expires_in field

#### Scenario: Token contains required claims
- **WHEN** a valid access token is generated
- **THEN** it MUST contain sub (user id), iat (issued at), exp (expiration), and roles claims

### Requirement: Refresh Token Mechanism
The system SHALL issue a refresh token alongside the access token. Refresh tokens SHALL be longer-lived (30 days) and used to obtain new access tokens without re-authentication.

#### Scenario: Refresh token returns new access token
- **WHEN** client sends a valid refresh_token to /api/auth/refresh
- **THEN** system returns a new access_token and refresh_token

#### Scenario: Invalid refresh token is rejected
- **WHEN** client sends an expired or invalid refresh_token
- **THEN** system returns 401 Unauthorized with error message

### Requirement: Rate Limiting on Login
The system SHALL apply progressive, Facebook-style rate limiting on login. Per-account failures trigger short escalating cooldowns (60 seconds after 5 failures, 5 minutes after 8, 30 minutes after 12, rolling 15-minute window). A per-IP safety net blocks at 30 failures per 15 minutes. Before any cooldown, clients with 2 or fewer attempts remaining MUST receive an attempts-remaining warning. Any successful login resets all counters.

#### Scenario: Normal login attempts succeed
- **WHEN** user makes fewer than 5 failed login attempts within 15 minutes
- **THEN** authentication proceeds normally

#### Scenario: Repeated failures trigger short cooldown
- **WHEN** user reaches 5 failed login attempts within 15 minutes
- **THEN** system returns 429 with retry_after_seconds in response body and allows retry after 60 seconds

#### Scenario: Successful login resets counters
- **WHEN** user logs in successfully after prior failures
- **THEN** failure counters for that IP and account are cleared

### Requirement: Session Tracking
The system SHALL create a session record on successful login containing user_id, ip_address, device_info, login_time, and status. Sessions MUST be automatically revoked on logout or token refresh.

#### Scenario: Session created on login
- **WHEN** user successfully logs in
- **THEN** a new session record is created with IP, device info, and timestamp

#### Scenario: Session revoked on logout
- **WHEN** user calls /api/auth/logout
- **THEN** the session status changes to revoked and token is blacklisted

### Requirement: Logout and Token Blacklisting
The system SHALL support explicit logout by blacklisting the current access token and revoking the associated session. Blacklisted tokens MUST be rejected on all subsequent requests.

#### Scenario: Successful logout
- **WHEN** user calls POST /api/auth/logout with valid token
- **THEN** system returns success and blacklists the token

#### Scenario: Blacklisted token is rejected
- **WHEN** client uses a blacklisted token on protected endpoint
- **THEN** system returns 401 Unauthorized

### Requirement: Real-time User Validation
The system SHALL verify that the authenticated user still exists in the database on each request. If the user account no longer exists, access MUST be denied with 401 Unauthorized regardless of token validity.

#### Scenario: Active user can access protected endpoints
- **WHEN** user with existing account makes authenticated request
- **THEN** request proceeds normally

#### Scenario: Deleted user is denied access
- **WHEN** user whose account was deleted makes authenticated request
- **THEN** system returns 401 Unauthorized with "user not found" message

### Requirement: Bearer Token Authentication
All protected endpoints SHALL require `Authorization: Bearer <token>` header. The system MUST extract and validate the JWT token from this header before processing the request.

#### Scenario: Request without auth header is rejected
- **WHEN** client makes request without Authorization header
- **THEN** system returns 401 Unauthorized

#### Scenario: Request with invalid token is rejected
- **WHEN** client sends request with malformed or expired JWT
- **THEN** system returns 401 Unauthorized with error details

### Requirement: Role-Based Access Control (Future)
The system SHALL support role-based access control. The JWT token MUST include a roles claim. Future endpoints MAY check user roles for authorization decisions.

#### Scenario: Token includes roles claim
- **WHEN** user logs in
- **THEN** the access_token contains a roles array with user's assigned roles
