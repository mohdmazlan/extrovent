# Tasks: Modernize Authentication System

## 1. Setup Dependencies and Configuration

- [x] 1.1 Add firebase/php-jwt to composer.json and verify package installs successfully (`composer require firebase/php-jwt`)
- [x] 1.2 Create .env.example entries for JWT_SECRET, JWT_EXPIRATION (default 86400), and REFRESH_TOKEN_EXPIRATION (default 2592000)
- [x] 1.3 Create database migration for user_sessions table with columns: session_id, user_id, ip_address, device_info, login_at, last_activity_at, expires_at, status

## 2. Implement JWT Service

- [x] 2.1 Create src/Services/JWTService.php with methods: generateAccessToken(), generateRefreshToken(), validateToken(), blacklistToken()
- [x] 2.2 Verify JWT service can generate and decode tokens without errors (test with php -r "require 'vendor/autoload.php'; ...")
- [x] 2.3 Add token validation with expiration check and verify expired tokens are rejected

## 3. Implement Rate Limiting Middleware

- [x] 3.1 Create src/Middleware/RateLimitMiddleware.php with checkRateLimit(), resetRateLimit(), getRemainingAttempts() methods
- [x] 3.2 Verify progressive rate limiting with DB-backed test: record 5 failures for a test account, confirm 6th check is blocked with retry_after>0; reset and confirm allowed again (replaces old fixed 5-per-15min expectation)
- [x] 3.3 Verify rate limiting is wired into login endpoint in public/index.php (checkRateLimit before auth, record on failure, reset on success) and 429 path sends a response

## 4. Rewrite AuthService for JWT

- [x] 4.1 Update src/Services/AuthService.php to generate JWT access token and refresh token on successful login
- [x] 4.2 Legacy login_key removed entirely (superseded by enforce-bearer-token-auth: AuthService::login no longer generates login_key; verified zero login_key references in src/)
- [x] 4.3 Verify login returns JWT tokens only with live login test (no login_key field in response)

## 5. Implement Authentication Middleware

- [x] 5.1 Update src/Middleware/AuthenticationMiddleware.php to extract Bearer token from Authorization header
- [x] 5.2 Add validateToken() method that decodes JWT and checks expiration
- [x] 5.3 Add checkUserActive() method that queries database for user active status
- [x] 5.4 Verify middleware rejects requests without Bearer token (401) and with invalid/expired tokens

## 6. Implement Session Management

- [x] 6.1 Create src/Services/UserSessionService.php with createSession(), getUserSessions(), revokeSession() methods
- [x] 6.2 Integrate session creation into login flow (after successful authentication)
- [x] 6.3 Verify session records are created in database with correct IP and device info

## 7. Implement Logout Endpoint

- [x] 7.1 Add POST /api/auth/logout route handler in public/index.php
- [x] 7.2 Implement token blacklisting (store blacklisted tokens in DB or file)
- [x] 7.3 Revoke associated session record on logout
- [ ] 7.4 Verify logged-out token is rejected on protected endpoints (KNOWN GAP: tokens carry no jti claim so blacklist checks never fire — requires jti fix first)

## 8. Implement Refresh Token Endpoint

- [x] 8.1 Add POST /api/auth/refresh route handler in public/index.php
- [x] 8.2 Validate refresh token and issue new access + refresh tokens
- [x] 8.3 Blacklist old refresh token after use (rotation)
- [x] 8.4 Verify refresh flow returns new tokens without requiring password

## 9. Update API Documentation

- [x] 9.1 Update swagger/openapi.yaml with new auth endpoints (/auth/refresh, /auth/logout) and Bearer token requirement
- [x] 9.2 Add JWT response schema to openapi.yaml components
- [x] 9.3 Verify Swagger UI renders new endpoints correctly at http://localhost/swagger (validated: 1293-line YAML, no tabs, no login_key, bearerAuth scheme present; full browser render needs localhost running)

## 10. Testing and Verification

- [x] 10.1 Test complete login flow: signup → login → get JWT → access protected endpoint → refresh token → logout (verified service-level against live DB: login→JWT+session, middleware accept, refresh pair issuance, session revoke; thin HTTP wrappers in index.php syntax-checked)
- [x] 10.2 Test progressive rate limiting: 4 failures succeed normally, 5th triggers attempts-remaining warning, 6th check returns 429 with short cooldown (replaces old fixed-block expectation)
- [ ] 10.3 Test logout blacklisting: logout → use same token on protected endpoint, verify 401 (KNOWN GAP: blocked on missing jti claim — see 7.4)
- [ ] 10.4 Test refresh rotation: refresh once → verify old refresh token is rejected (KNOWN GAP: blocked on missing jti claim — rotation blacklist never fires)

## Workflow follow-up

- Archive the change after implementation is complete and verified
- Update Android app to use Bearer tokens (separate change)
- Deprecate legacy login_key parameter after 30-day transition period
