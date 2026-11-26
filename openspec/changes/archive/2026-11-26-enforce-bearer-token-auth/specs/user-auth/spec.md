# Spec Delta: User Authentication

## Purpose

Enforces Bearer token authentication as the only valid auth method for all protected endpoints, removes legacy login_key support, and adds rate limiting on the login endpoint to prevent brute-force attacks.

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Legacy login_key Authentication
**Reason**: Replaced by exclusive Bearer token authentication. The login_key was a weak md5 hash with no expiration and is no longer supported.
**Migration**: Clients must use Bearer token authentication. Obtain tokens from /auth/login and send Authorization header on subsequent requests.

### Requirement: Dual Auth Mode Support
**Reason**: Simplified to single auth method (Bearer token). The fallback logic that tried login_key when Bearer token failed has been removed.
**Migration**: All clients must be updated to send Bearer tokens; the login_key parameter is no longer accepted by any endpoint.
