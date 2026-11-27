# Spec Delta

## MODIFIED Requirements

### Requirement: Refresh Token Mechanism
The system SHALL issue a refresh token alongside the access token. Refresh tokens SHALL carry a unique jti claim and be used to obtain new access tokens without re-authentication even when the access token is missing or expired, matching `merpati/backend/src/Auth/AuthController.php:259` `POST /auth/refresh {refresh_token}`. Each refresh SHALL revoke the used refresh token and SHALL extend the sliding window. The client SHALL be able to call POST /auth/refresh with only a valid refresh_token and no Authorization header.

#### Scenario: Refresh token returns new access token
- **WHEN** client sends a valid refresh_token to /api/auth/refresh
- **THEN** system returns a new access_token and refresh_token

#### Scenario: Invalid refresh token is rejected
- **WHEN** client sends an expired or invalid refresh_token
- **THEN** system returns 401 Unauthorized with error message

#### Scenario: Used refresh token cannot be reused
- **WHEN** client sends a refresh_token that was already used to refresh
- **THEN** system returns 401 Unauthorized

#### Scenario: Refresh without access token succeeds
- **WHEN** client has no access token but holds a valid refresh_token and calls /auth/refresh with {refresh_token}
- **THEN** system returns a new access_token and refresh_token without requiring an Authorization header

## ADDED Requirements

### Requirement: Client-Side Token Expiry Pre-Check
The system SHALL validate token expiry client-side by decoding the JWT payload before attaching it to a request and SHALL treat expired tokens as unauthenticated without a network call.

#### Scenario: Expired token not sent
- **WHEN** the stored token has exp in the past as determined by validateToken
- **THEN** the client clears the session and does not send Authorization header

### Requirement: Rate Limit Feedback Surfacing
The system SHALL surface 429 Too Many Requests responses from the authentication middleware including remaining attempts and retry-after information to the user.

#### Scenario: Rate limited login shows retry guidance
- **WHEN** login returns 429 with retry_after information
- **THEN** the client displays the retry delay and remaining attempts to the user

### Requirement: Identifier Login Without Merchant
The system SHALL accept `identifier` (email or username) and `password` at `POST /auth/login` without requiring `merchant_code`, as in `merpati/backend/src/Auth/AuthController.php:99`. No tenant resolution SHALL be performed.

#### Scenario: Login with username identifier
- **WHEN** client calls /auth/login with identifier as username and valid password
- **THEN** authentication succeeds without a merchant field

### Requirement: Sliding Session Semantics
The system SHALL maintain a 6-month sliding session where every authenticated request updates `last_activity_at` and `expires_at` per `merpati/backend/src/Auth/AuthGuard.php:43`, so the session only expires after prolonged inactivity.

#### Scenario: Active user session never expires
- **WHEN** an authenticated user makes a request each day
- **THEN** the session remains valid beyond 30 days
