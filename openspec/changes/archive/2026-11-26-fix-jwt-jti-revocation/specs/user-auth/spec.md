# Spec Delta: User Authentication

## MODIFIED Requirements

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

### Requirement: Logout and Token Blacklisting
The system SHALL support explicit logout by blacklisting the current access token (by its jti) and revoking the associated session. Blacklisted tokens MUST be rejected on all subsequent requests.

#### Scenario: Successful logout
- **WHEN** user calls POST /api/auth/logout with valid token
- **THEN** system returns success and blacklists the token

#### Scenario: Blacklisted token is rejected
- **WHEN** client uses a blacklisted token on protected endpoint
- **THEN** system returns 401 Unauthorized

## ADDED Requirements

### Requirement: Pre-Fix Tokens Are Rejected
The system SHALL reject tokens minted before the jti fix deployed. Clients presenting such tokens MUST receive 401 Unauthorized and re-authenticate to obtain new tokens.

#### Scenario: Pre-fix token forces re-login
- **WHEN** client sends a token without a jti claim issued before the cutoff
- **THEN** system returns 401 Unauthorized

#### Scenario: Post-fix tokens work normally
- **WHEN** client sends a token carrying a jti claim
- **THEN** validation proceeds normally
