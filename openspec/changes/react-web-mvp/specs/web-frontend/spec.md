# Spec Delta: Web Frontend

## Purpose

Defines what the React web client must do: authenticate against the existing Bearer-token backend, call protected endpoints through one shared client, render the MVP slices (feed, events, places with open-source maps, profiles, search), and stay out of the explicitly deferred areas.

## ADDED Requirements

### Requirement: CORS-Enabled Backend Access
The web app SHALL call the backend only through endpoints that respond with appropriate CORS headers, and SHALL handle preflight (`OPTIONS`) transparently via the browser.

#### Scenario: Cross-origin calls succeed
- **WHEN** the app (served from its own origin) calls `/api/*`
- **THEN** the browser permits the request and the app receives the response

### Requirement: Token-Based Login
The app SHALL authenticate via `POST /api/auth/login` with `user_id` and `password`, keeping the access token in memory and persisting the refresh token in `localStorage`. It SHALL NOT store any `login_key`.

#### Scenario: Successful login stores tokens
- **WHEN** the user logs in with valid credentials
- **THEN** the app stores the token pair and shows the main view

#### Scenario: Failed login surfaces the server message
- **WHEN** the server rejects credentials with 401 or rate-limits with 429
- **THEN** the app displays the server-provided message, including attempts-remaining and retry-after guidance

### Requirement: Shared API Client
All backend calls SHALL go through one `apiClient` that attaches `Authorization: Bearer <access_token>`, unwraps the `{success, data, error}` envelope (resolving with `data`, rejecting with `error`), refreshes once on 401 and retries the original request, and forces re-login when refresh fails.

#### Scenario: Authenticated call carries the header
- **WHEN** the app calls a protected endpoint with a valid access token
- **THEN** the request includes the Bearer header and resolves with the envelope's `data`

#### Scenario: Expired token refreshes transparently
- **WHEN** a call receives 401 for an expired (not revoked) token and a valid refresh token exists
- **THEN** the client refreshes, retries once, and the user sees no interruption

#### Scenario: Revoked session forces re-login
- **WHEN** refresh is rejected with 401
- **THEN** the client clears stored tokens and returns the user to the login screen

### Requirement: Logout Revokes Server-Side
Logging out SHALL call `POST /api/auth/logout` with the current access token before clearing local token storage.

#### Scenario: Logout ends the server session
- **WHEN** the user logs out with network access
- **THEN** the app calls the logout endpoint and then clears stored tokens

#### Scenario: Offline logout still clears locally
- **WHEN** the user logs out without network access
- **THEN** the app clears stored tokens locally so no stale token remains on device

### Requirement: MVP Slices
The app SHALL provide login/register, post feed (list, like, comment), events (list, view, create, join), places (list, view, create), user profiles with update, and unified search — using only endpoints that exist on the backend.

#### Scenario: Each slice loads from the API
- **WHEN** the user opens any MVP screen
- **THEN** its content comes from the corresponding `/api/*` route with no legacy `android_php` calls anywhere in the app

### Requirement: Open-Source Maps
Place coordinates SHALL render with Leaflet over OpenStreetMap tiles at zero licensing cost. The app SHALL parse the backend's opaque `coordinate` string into map markers and MUST NOT require Google Maps keys.

#### Scenario: Place shows on the map
- **WHEN** a place with a valid coordinate string is viewed
- **THEN** a Leaflet marker appears at the parsed position

### Requirement: Deferred Areas Stay Out
The app SHALL NOT implement ratings, notifications, invites, FCM push, uploads, joined-events listing, other-user profiles, or chat in this change; those depend on backend follow-ups enumerated in the Android mapping matrix.

#### Scenario: Out-of-scope area is not shipped
- **WHEN** the MVP is reviewed
- **THEN** none of the deferred areas are present as features (their absence is by design, not omission)
