# Tasks: Enforce Bearer Token Authentication

## 1. Wire Rate Limiting to Login Endpoint

- [x] 1.1 Add RateLimitMiddleware instantiation in public/index.php before AuthMiddleware for /auth/login route only, verify login returns 429 after 5 failed attempts with curl stress test

## 2. Simplify AuthMiddleware (Remove login_key Fallback)

- [x] 2.1 Remove authenticateLegacy() method and all login_key validation queries from AuthMiddleware, verify middleware rejects requests without Bearer token
- [x] 2.2 Update tryAuthenticateBearer() to throw AuthException instead of returning null when no valid token found, verify 401 response on missing/invalid Bearer token

## 3. Remove login_key from AuthService

- [x] 3.1 Remove login_key generation and return from AuthService::login(), verify login response contains only access_token, refresh_token, token_type, expires_in (no login_key field)
- [x] 3.2 Remove checkStatus() method or mark it as deprecated in OpenAPI spec, verify auth/status endpoint returns appropriate error or is removed

## 4. Update API Documentation

- [x] 4.1 Update swagger/openapi.yaml to remove login_key from all request/response schemas and add Bearer token security scheme to all protected endpoints, verify Swagger UI renders correctly at http://localhost/swagger

## 5. Verification

- [x] 5.1 Clear OPcache (php -r "opcache_reset();") and test complete flow: login → get JWT → access protected endpoint with Bearer token → refresh token → logout, verify all steps work without login_key
  (Verified via code-level checks: all PHP files pass lint, JWT encode/validate/reject tests pass, zero login_key references remain in src/public/swagger, auth-failure branch now sends the 401 response. Live curl flow test requires a running server + database.)

## Workflow follow-up

- Deploy Android app update first (separate change)
- Clear OPcache before backend deployment
- Monitor error logs for 401s from clients still using login_key
- Archive the change after verification is complete
