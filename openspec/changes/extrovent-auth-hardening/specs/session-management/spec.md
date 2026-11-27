# Spec Delta

## Purpose

Keeps sessions alive while the user is active via a 6-month sliding window touched on every authenticated request and by periodic foreground keep-alive, matching merpati's proven session model.

## ADDED Requirements

### Requirement: Sliding Session Window
The system SHALL extend the session's `last_activity_at` and `expires_at` on every authenticated request to `now + 6 months` as in `merpati/backend/src/Auth/AuthGuard.php:43`, so an active user never expires.

#### Scenario: Authenticated request extends session
- **WHEN** an authenticated `GET /users/me` succeeds
- **THEN** the backend updates `last_activity_at` and `expires_at` for that user

#### Scenario: Inactive session eventually expires
- **WHEN** no authenticated request has occurred for more than the refresh TTL
- **THEN** `POST /auth/refresh` returns 401 and the client logs out

### Requirement: Frontend Keep-Alive
The system SHALL send a background `GET /users/me` every 5 minutes when not hidden to touch the sliding window (`merpati/web/src/api/client.ts:94`).

#### Scenario: Keep-alive when visible
- **WHEN** the page is visible and an access token exists for 5 minutes
- **THEN** the client calls `GET /users/me`

#### Scenario: Keep-alive paused when hidden
- **WHEN** `document.hidden` is true
- **THEN** no keep-alive request is sent

### Requirement: Client Token Expiry Gate
The system SHALL decode the JWT `exp` before sending a request and SHALL treat expired tokens as unauthenticated without a network call.

#### Scenario: Expired token not sent
- **WHEN** stored `access_token` has `exp` in the past
- **THEN** no `Authorization` header is sent

### Requirement: WebSocket Re-Auth Signal
The system SHALL dispatch `merpati:token-refreshed` on successful refresh (`merpati/web/src/api/client.ts:66`) so realtime layers can re-handshake with the fresh token.

#### Scenario: Refresh notifies realtime
- **WHEN** refresh yields a new `access_token`
- **THEN** `window.dispatchEvent(new CustomEvent('merpati:token-refreshed'))` is emitted
