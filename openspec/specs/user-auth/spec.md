# User Authentication Specification

## Purpose

Enforces Bearer token authentication as the only valid auth method for all protected endpoints, removes legacy login_key support, and adds rate limiting on the login endpoint to prevent brute-force attacks.

## Requirements

### Requirement: Rate Limiting on Login
The system SHALL limit login attempts to 5 per 15 minutes per IP address. After exceeding the limit, the client MUST receive a 429 Too Many Requests response with retry-after information.

#### Scenario: Normal login attempts succeed
- **WHEN** user makes fewer than 5 failed login attempts within 15 minutes
- **THEN** authentication proceeds normally

#### Scenario: Exceeded rate limit blocks login
- **WHEN** user exceeds 5 failed login attempts within 15 minutes
- **THEN** system returns 429 with retry_after_seconds in response body

### Requirement: Bearer Token Authentication (Exclusive)
All protected endpoints SHALL require `Authorization: Bearer <token>` header. The system MUST extract and validate the JWT token from this header before processing the request. No other authentication method is accepted.

#### Scenario: Request without auth header is rejected
- **WHEN** client makes request without Authorization header
- **THEN** system returns 401 Unauthorized

#### Scenario: Request with invalid token is rejected
- **WHEN** client sends request with malformed or expired JWT
- **THEN** system returns 401 Unauthorized with error details

### Requirement: Login Response Contains Only JWT Tokens
The login endpoint SHALL return only JWT access token and refresh token. The response MUST NOT include a legacy `login_key` field.

#### Scenario: Successful login returns JWT tokens
- **WHEN** user provides valid credentials to /auth/login
- **THEN** system returns access_token, refresh_token, token_type, expires_in, and user_id

### Requirement: Token Validation Includes User Existence Check
The authentication middleware SHALL verify that the authenticated user still exists in the database on each request. If the user has been deleted, access MUST be denied regardless of token validity.

#### Scenario: Active user can access protected endpoints
- **WHEN** user with existing account makes authenticated request with valid Bearer token
- **THEN** request proceeds normally

#### Scenario: Deleted user is denied access
- **WHEN** user whose account was deleted makes authenticated request
- **THEN** system returns 401 Unauthorized with "user not found" message

### Requirement: JWT Access Token Generation
The system SHALL generate a short-lived JWT access token upon successful login. The token MUST contain sub (user id), roles, iat (issued at), exp (expiration), and a unique jti (token id) claim. Tokens SHALL expire after 24 hours by default.

#### Scenario: Successful login returns JWT
- **WHEN** user provides valid credentials (user_id and password)
- **THEN** system returns an access_token with user claims and expires_in field

#### Scenario: Token contains required claims
- **WHEN** a valid access token is generated
- **THEN** it MUST contain sub (user id), iat (issued at), exp (expiration), roles, and a unique jti claim

### Requirement: Refresh Token Mechanism
The system SHALL issue a refresh token alongside the access token. Refresh tokens SHALL be longer-lived (30 days), carry a unique jti claim, and be used to obtain new access tokens without re-authentication. Each refresh SHALL revoke the used refresh token so it cannot be reused.

#### Scenario: Refresh token returns new access token
- **WHEN** client sends a valid refresh_token to /api/auth/refresh
- **THEN** system returns a new access_token and refresh_token

#### Scenario: Invalid refresh token is rejected
- **WHEN** client sends an expired or invalid refresh_token
- **THEN** system returns 401 Unauthorized with error message

#### Scenario: Used refresh token cannot be reused
- **WHEN** client sends a refresh_token that was already used to refresh
- **THEN** system returns 401 Unauthorized

### Requirement: Session Tracking
The system SHALL create a session record on successful login containing user_id, ip_address, device_info, login_time, and status. Sessions MUST be automatically revoked on logout or token refresh.

#### Scenario: Session created on login
- **WHEN** user successfully logs in
- **THEN** a new session record is created with IP, device info, and timestamp

#### Scenario: Session revoked on logout
- **WHEN** user calls /api/auth/logout
- **THEN** the session status changes to revoked and token is blacklisted

### Requirement: Logout and Token Blacklisting
The system SHALL support explicit logout by blacklisting the current access token (by its jti) and revoking the associated session. Blacklisted tokens MUST be rejected on all subsequent requests.

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

### Requirement: Pre-Fix Tokens Are Rejected
The system SHALL reject tokens minted before the jti fix deployed. Clients presenting such tokens MUST receive 401 Unauthorized and re-authenticate to obtain new tokens.

#### Scenario: Pre-fix token forces re-login
- **WHEN** client sends a token without a jti claim issued before the cutoff
- **THEN** system returns 401 Unauthorized

#### Scenario: Post-fix tokens work normally
- **WHEN** client sends a token carrying a jti claim
- **THEN** validation proceeds normally
