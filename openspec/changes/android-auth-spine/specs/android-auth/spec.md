# Spec Delta: Android Authentication

## MODIFIED Requirements

### Requirement: Token-Based Login
The app SHALL authenticate via `POST /api/auth/login` with `user_id` and `password`. The returned `access_token` SHALL live in memory only and MUST NOT be persisted; the `refresh_token` SHALL be persisted in place of the legacy `login_key`. After process death the app MUST recover transparently via the silent-refresh flow on the next protected call.

#### Scenario: Successful login stores tokens
- **WHEN** the user logs in with valid credentials
- **THEN** the app holds the access token in memory, persists the refresh token, and navigates to the main screen without storing any `login_key`

#### Scenario: Failed login surfaces the server message
- **WHEN** the server rejects credentials with 401 or rate-limits with 429
- **THEN** the app displays the server-provided message, including attempts-remaining warnings and retry-after guidance

#### Scenario: Restarted app resumes via refresh
- **WHEN** the app restarts with a persisted refresh token but no in-memory access token
- **THEN** the first protected call refreshes silently and proceeds without showing the login screen

## ADDED Requirements

### Requirement: Release Base URL
Release builds SHALL send all API calls to `https://extrovent.mikael.my/api/` with no user-configurable host or IP-switching UI.

#### Scenario: Release build uses production URL
- **WHEN** the app issues any API request in a release build
- **THEN** the request targets `https://extrovent.mikael.my/api/` regardless of network

### Requirement: Registration Issues Tokens
The app SHALL register via `POST /api/auth/signup` with `user_id`, `email`, `password`, and `confirm_password`, and on success immediately authenticate with the returned token pair (same as the web client) instead of forcing a separate login.

#### Scenario: Successful registration logs the user in
- **WHEN** the user registers with valid details and matching passwords
- **THEN** the app stores the returned tokens and navigates to the main screen without showing the login screen

#### Scenario: Registration surfaces validation errors
- **WHEN** the server rejects the registration (duplicate user, invalid email, mismatched passwords)
- **THEN** the app displays the server-provided error message on the register screen
