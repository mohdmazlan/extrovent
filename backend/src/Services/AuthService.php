<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Exceptions\AuthException;

/**
 * Auth service - handles authentication flows.
 */
class AuthService
{
    public function __construct(
        private Database $db,
        private ?JWTService $jwtService = null,
        private ?UserSessionService $sessionService = null
    ) {}

    /**
     * POST /auth/login
     */
    public function login(array $data): array
    {
        $userId = trim($data['user_id'] ?? '');
        $password = $data['password'] ?? '';

        if (empty($userId) || empty($password)) {
            throw new AuthException('Missing user_id or password');
        }

        // Check if user exists first
        $userRow = $this->db->fetchOne(
            "SELECT password FROM users WHERE user_id = ?",
            [$userId]
        );

        if (!$userRow) {
            throw new AuthException('User ID not registered');
        }

        $storedHash = $userRow['password'];
        $inputHash = md5($password);

        // Backward compatibility: check md5 first, then bcrypt
        if ($inputHash !== $storedHash && !password_verify($password, $storedHash)) {
            throw new AuthException('Invalid password');
        }

        // Migrate to bcrypt if was md5
        if ($inputHash === $storedHash) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $this->db->update('users', ['password' => $newHash], 'user_id = ?', [$userId]);
        }

        // Get user profile
        $profile = $this->db->fetchOne(
            "SELECT user_id, nickname, email, avatar FROM users WHERE user_id = ?",
            [$userId]
        );

        if (!$profile) {
            throw new AuthException('User not found');
        }

        if ($this->jwtService === null) {
            throw new AuthException('Authentication service unavailable');
        }

        // Get user roles for JWT token claims
        $roles = $this->getUserRoles($userId);

        // Generate access token
        $accessData = $this->jwtService->generateAccessToken($userId, ['roles' => $roles]);

        // Generate refresh token
        $refreshData = $this->jwtService->generateRefreshToken($userId);

        $result = [
            'user_id' => $userId,
            'nickname' => $profile['nickname'] ?? '',
            'email' => $profile['email'] ?? '',
            'avatar' => $profile['avatar'] ?? '',
            'access_token' => $accessData['access_token'],
            'refresh_token' => $refreshData['refresh_token'],
            'token_type' => 'Bearer',
            'expires_in' => $accessData['expires_in'],
        ];

        // Create session record if session service available
        if ($this->sessionService !== null) {
            $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
            $sessionId = $this->sessionService->createSession($userId, $ip);
            $result['session_id'] = $sessionId;
        }

        return $result;
    }

    /**
     * Get user roles for JWT token claims.
     * 
     * @param string $userId
     * @return array<string>
     */
    private function getUserRoles(string $userId): array
    {
        $roles = ['user']; // Default role
        
        // Check if user has business profile (organizer role)
        $hasProfile = $this->db->fetchOne(
            "SELECT id FROM business_profile WHERE user_id = ?",
            [$userId]
        );
        
        if ($hasProfile) {
            $roles[] = 'organizer';
        }
        
        return $roles;
    }

    /**
     * Check if user is an organizer (has business profile).
     */
    public function checkOrganizerStatus(array $data): array
    {
        $userId = $data['user_id'] ?? '';

        if (empty($userId)) {
            throw new AuthException('Missing user_id');
        }

        $row = $this->db->fetchOne(
            "SELECT id FROM business_profile WHERE user_id = ?",
            [$userId]
        );

        return [
            'is_organizer' => (bool) $row,
            'status' => $row ? 'approved' : 'not_approved',
        ];
    }
}
