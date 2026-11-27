<?php

namespace Extrovent\Middleware;

use Extrovent\Database\Database;
use Extrovent\Exceptions\AuthException;
use Extrovent\Services\JWTService;
use Extrovent\Services\UserSessionService;

/**
 * Authentication middleware.
 * Bearer token authentication only (JWT).
 */
class AuthMiddleware
{
    private JWTService $jwtService;
    private ?UserSessionService $sessionService;

    public function __construct(
        private Database $db,
        ?JWTService $jwtService = null,
        ?UserSessionService $sessionService = null
    ) {
        $this->jwtService = $jwtService ?? new JWTService($db);
        $this->sessionService = $sessionService ?? new UserSessionService($db);
    }

    /**
     * Authenticate request using Bearer token only.
     * Returns user_id or throws AuthException.
     */
    public function authenticate(array $input): string
    {
        $userId = $this->authenticateBearer();

        // Verify user still exists in database (logged-in check)
        $this->checkUserActive($userId);

        // Sliding window: extend session on every authenticated request (merpati parity)
        $input['_auth_user_id'] = $userId;
        $this->updateSessionActivity($input);

        return $userId;
    }

    /**
     * Authenticate using Bearer token from Authorization header.
     * Throws AuthException when token is missing or invalid.
     */
    private function authenticateBearer(): string
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
            throw new AuthException('Missing authorization token');
        }

        $token = $matches[1];

        // Validate and decode the token
        try {
            $decoded = $this->jwtService->validateToken($token, 'access');
        } catch (\InvalidArgumentException $e) {
            throw new AuthException($e->getMessage() ?: 'Invalid or expired token');
        }

        // Check if token is blacklisted
        if (isset($decoded->jti) && $this->jwtService->isTokenBlacklisted((string) $decoded->jti)) {
            throw new AuthException('Token has been revoked');
        }

        $userId = (string) ($decoded->sub ?? '');

        if ($userId === '') {
            throw new AuthException('Invalid token: missing user identifier');
        }

        return $userId;
    }

    /**
     * Verify that the user still exists in the database (logged-in check).
     *
     * @param string $userId
     * @throws AuthException If user is not found
     */
    private function checkUserActive(string $userId): void
    {
        // Check if user exists — confirms the token owner is still a valid logged-in user
        $userExists = $this->db->fetchOne(
            "SELECT id FROM users WHERE id = ?",
            [$userId]
        );

        if (!$userExists) {
            throw new AuthException('User not found');
        }
    }

    /**
     * Sliding window: any authenticated activity extends session 6 months (forever if active).
     * Mirrors merpati/backend/src/Auth/AuthGuard.php:43 touch.
     */
    private function updateSessionActivity(array $input): void
    {
        if ($this->sessionService === null) {
            return;
        }

        $userId = $input['_auth_user_id'] ?? null;
        if (!$userId) {
            try {
                $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
                if (preg_match('/Bearer\s+(\S+)/', $hdr, $m)) {
                    $dec = $this->jwtService->validateToken($m[1], 'access');
                    $userId = (string) ($dec->sub ?? '');
                }
            } catch (\Throwable $e) {}
        }

        $sessionId = $input['session_id'] ?? '';
        try {
            if ($sessionId) {
                $this->sessionService->updateActivity($sessionId);
            } elseif ($userId) {
                // Extend all active sessions for this user — 6 months sliding
                $this->sessionService->touchAllSessions($userId);
            }
        } catch (\Throwable $e) {
            // Fail silently - session tracking is optional
        }
    }

    /**
     * Optional authentication - returns user_id or null (Bearer token only).
     */
    public function tryAuthenticate(array $input): ?string
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
            return null;
        }

        $token = $matches[1];

        try {
            $decoded = $this->jwtService->validateToken($token, 'access');
        } catch (\InvalidArgumentException) {
            return null;
        }

        // Reject blacklisted tokens even in optional auth
        if (isset($decoded->jti) && $this->jwtService->isTokenBlacklisted((string) $decoded->jti)) {
            return null;
        }

        $userId = (string) ($decoded->sub ?? '');

        return $userId !== '' ? $userId : null;
    }
}
