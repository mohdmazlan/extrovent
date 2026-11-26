# Tasks: Fix JWT jti Revocation Gap

## 1. Mint jti in Both Token Generators

- [x] 1.1 Add `jti` (via existing `generateJti()`) to `generateAccessToken()` and `generateRefreshToken()` payloads in `src/Services/JWTService.php`, and verify with `php tests/JWTServiceTest.php` plus a decode check that both token types carry a unique non-empty `jti`
- [x] 1.2 Reject pre-fix tokens in `validateToken()`: tokens without a `jti` whose `iat` predates the deploy cutoff throw invalid-token, and verify old-shape tokens are rejected while new tokens validate

## 2. Clock-Safe Blacklist Writes and Cleanup

- [x] 2.1 Compute `expires_at` on the DB clock (`DATE_ADD(NOW(), INTERVAL ? SECOND)`) in `blacklistToken()`, and verify a blacklisted jti is found by `isTokenBlacklisted()` and disappears after expiry
- [x] 2.2 Delete expired `blacklisted_tokens` rows (`expires_at < NOW()`) on the blacklist write path, and verify row count stays bounded after blacklisting an already-expired jti

## 3. End-to-End Revocation Verification

- [x] 3.1 Verify logout revokes: login → logout → reuse access token on a protected endpoint returns 401 (DB-backed test with real services, mirroring the earlier `verify_auth.php` approach)
- [x] 3.2 Verify refresh rotation revokes: refresh → reuse old refresh token returns 401, new pair validates
- [x] 3.3 Verify pre-fix cutoff: craft a token without `jti` and confirm it is rejected with 401

## Workflow follow-up

- Coordinate deploy with Android client (refresh-401 must trigger re-login, not a retry loop)
- Announce the one-time forced re-login before deploying
- Archive the change after verification is complete; close out modernize-auth-system tasks 7.4/10.3/10.4 against this fix
