<?php

namespace Extrovent\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Extrovent\Database\Database;

/**
 * JWT Service - handles JWT token generation, validation, and blacklisting.
 */
class JWTService
{
    private Database $db;
    private string $secretKey;
    private int $accessExpiration;
    private int $refreshExpiration;
    private string $algorithm = 'HS256';

    /**
     * Cutoff timestamp (2026-11-26): tokens minted before the jti fix
     * carry no `jti` claim. Any jti-less token with iat before this
     * is rejected, forcing a one-time re-login. No migration needed.
     */
    private const JTI_CUTOFF_IAT = 1795651200;

    public function __construct(Database $db)
    {
        $this->db = $db;
        $this->secretKey = $_ENV['JWT_SECRET'] ?? '';
        if (strlen($this->secretKey) < 32) {
            throw new \RuntimeException('JWT_SECRET must be at least 32 characters long. Set it in your .env file.');
        }
        $this->accessExpiration = (int) ($_ENV['JWT_EXPIRATION'] ?? 86400); // 24 hours
        $this->refreshExpiration = (int) ($_ENV['REFRESH_TOKEN_EXPIRATION'] ?? 2592000); // 30 days
    }

    /**
     * Generate a short-lived access token.
     *
     * @param string $userId
     * @param array<string, mixed> $payload Additional claims to include
     * @return array{access_token: string, expires_in: int}
     */
    public function generateAccessToken(string $userId, array $payload = []): array
    {
        $now = time();
        $tokenPayload = [
            'iss' => $_ENV['APP_URL'] ?? 'http://localhost',
            'iat' => $now,
            'exp' => $now + $this->accessExpiration,
            'sub' => $userId,
            'type' => 'access',
            'jti' => $this->generateJti(),
        ];

        // Add custom claims from payload
        if (!empty($payload)) {
            $tokenPayload = array_merge($tokenPayload, $payload);
        }

        $token = JWT::encode($tokenPayload, $this->secretKey, $this->algorithm);

        return [
            'access_token' => $token,
            'expires_in' => $this->accessExpiration,
        ];
    }

    /**
     * Generate a long-lived refresh token.
     *
     * @param string $userId
     * @return array{refresh_token: string, expires_in: int}
     */
    public function generateRefreshToken(string $userId): array
    {
        $now = time();
        $tokenPayload = [
            'iss' => $_ENV['APP_URL'] ?? 'http://localhost',
            'iat' => $now,
            'exp' => $now + $this->refreshExpiration,
            'sub' => $userId,
            'type' => 'refresh',
            'jti' => $this->generateJti(),
        ];

        $token = JWT::encode($tokenPayload, $this->secretKey, $this->algorithm);

        return [
            'refresh_token' => $token,
            'expires_in' => $this->refreshExpiration,
        ];
    }

    /**
     * Decode and validate a JWT token.
     *
     * @param string $token The JWT token string
     * @param string $type Expected token type ('access' or 'refresh')
     * @return object Decoded token payload
     * @throws \Firebase\JWT\Exception
     */
    public function validateToken(string $token, string $type = 'access'): object
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secretKey, $this->algorithm));

            // Verify token type matches expectation
            if (isset($decoded->type) && $decoded->type !== $type) {
                throw new \InvalidArgumentException("Invalid token type: expected {$type}, got {$decoded->type}");
            }

            // Reject pre-fix tokens: no jti and issued before the cutoff.
            // Our generators always mint jti now, so jti-less tokens can
            // only be legacy tokens that revocation cannot track.
            if (!isset($decoded->jti) && (int) ($decoded->iat ?? 0) < self::JTI_CUTOFF_IAT) {
                throw new \InvalidArgumentException('Token issued before security update; please log in again', 401);
            }

            return $decoded;
        } catch (\Firebase\JWT\ExpiredException $e) {
            throw new \InvalidArgumentException('Token has expired', 401);
        } catch (\Firebase\JWT\UnexpectedValueException $e) {
            throw new \InvalidArgumentException('Invalid token structure', 401);
        } catch (\DomainException $e) {
            throw new \InvalidArgumentException('Token verification failed', 401);
        }
    }

    /**
     * Extract the user ID from an access token.
     *
     * @param string $token
     * @return string|null Returns null if token is invalid or expired
     */
    public function getUserIdFromToken(string $token): ?string
    {
        try {
            $decoded = $this->validateToken($token, 'access');
            return (string) ($decoded->sub ?? null);
        } catch (\InvalidArgumentException) {
            return null;
        }
    }

    /**
     * Check if a token has been blacklisted.
     *
     * @param string $tokenJTI The JTI claim from the token
     * @return bool True if blacklisted
     */
    public function isTokenBlacklisted(string $tokenJTI): bool
    {
        $row = $this->db->fetchOne(
            "SELECT id FROM blacklisted_tokens WHERE token_jti = ? AND expires_at > NOW()",
            [$tokenJTI]
        );

        return (bool) $row;
    }

    /**
     * Blacklist a token (add to blacklisted_tokens table).
     * Expiry is computed on the DB clock so PHP/MySQL timezone skew
     * can't shift it (see RateLimitMiddleware fix for the same bug class).
     *
     * @param string $tokenJTI The JTI claim from the token
     * @param string $userId The user ID associated with the token
     * @param int $expiresAt Unix timestamp when the token expires
     * @return bool True if successfully blacklisted
     */
    public function blacklistToken(string $tokenJTI, string $userId, int $expiresAt): bool
    {
        // Duration (not wall clock), so PHP/MySQL skew is irrelevant here.
        $ttlSeconds = max(0, $expiresAt - time());
        try {
            // Opportunistic cleanup: no cron exists, so bound the table here.
            $this->cleanupExpiredTokens();
            $this->db->query(
                "INSERT INTO blacklisted_tokens (token_jti, user_id, blacklisted_at, expires_at) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND))",
                [$tokenJTI, $userId, $ttlSeconds]
            );

            return true;
        } catch (\Throwable $e) {
            // Token might already be blacklisted (unique constraint)
            return false;
        }
    }

    /**
     * Delete expired blacklist rows. Called opportunistically on the
     * write path; all reads already filter on expires_at > NOW().
     */
    public function cleanupExpiredTokens(): int
    {
        $stmt = $this->db->query("DELETE FROM blacklisted_tokens WHERE expires_at < NOW()");
        return $stmt->rowCount();
    }

    /**
     * Generate a unique JTI (JWT ID) for token tracking.
     *
     * @return string
     */
    public function generateJti(): string
    {
        return bin2hex(random_bytes(32));
    }
}
