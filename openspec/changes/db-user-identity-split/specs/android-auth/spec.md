# Spec Delta

## MODIFIED Requirements

### Requirement: Token-Based Login
The app SHALL authenticate via `POST /api/auth/login` with `username` (or `email` alias via `identifier`) and `password`, and persist the returned `id` (UUID `users.id`), `username`, `access_token`, `refresh_token`, and `expires_in` in place of the legacy `login_key`. The app SHALL NOT send `user_id` as the login handle. `username` is mutable; `id` is the stable FK for all data.

#### Scenario: Successful login stores tokens
- **WHEN** the user logs in with valid `username` (or `email`) and password
- **THEN** the app stores `id` (UUID `users.id`), `username`, access and refresh tokens and navigates to the main screen without storing any `login_key`

#### Scenario: Failed login surfaces the server message
- **WHEN** the server rejects credentials with 401 or rate-limits with 429
- **THEN** the app displays the server-provided message, including attempts-remaining warnings and retry-after guidance

### Requirement: Bearer Header on Protected Calls
Every request to a protected `/api/*` endpoint SHALL carry an `Authorization: Bearer <access_token>` header. No request SHALL send `username` or `user_id` as a substitute credential or include a `login_key` parameter. `sub` in the token is now `users.id` UUID.

#### Scenario: Authenticated request carries the header
- **WHEN** the app calls any protected endpoint with a valid stored access token whose `sub` is `users.id` UUID
- **THEN** the request includes the Bearer header and succeeds without credential query parameters
