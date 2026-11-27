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
     * Extract identifier (email or username/@username) — merpati parity.
     * Accepts `identifier` or legacy `user_id`/`email` for backward compat.
     * Trims @ prefix, case-insensitive for username lookup.
     */
    private function extractIdentifier(array $data): string
    {
        $identifier = trim((string) ($data['identifier'] ?? ''));
        if ($identifier === '') $identifier = trim((string) ($data['user_id'] ?? ''));
        if ($identifier === '') $identifier = trim((string) ($data['email'] ?? ''));
        // strip leading @ like merpati (@alice)
        $identifier = ltrim($identifier, '@');
        return $identifier;
    }

    private function findUserByIdentifier(string $identifier): ?array
    {
        // users.id UUID PK, users.username/email UNIQUE, password in user_credentials
        // Try username (case-insensitive)
        $row = $this->db->fetchOne(
            "SELECT u.id as user_id, u.username, u.email, c.password_hash as password FROM users u LEFT JOIN user_credentials c ON c.user_id = u.id WHERE LOWER(u.username) = LOWER(?) LIMIT 1",
            [$identifier]
        );
        if ($row && $row['user_id']) return $row;
        // Fallback to email
        $row = $this->db->fetchOne(
            "SELECT u.id as user_id, u.username, u.email, c.password_hash as password FROM users u LEFT JOIN user_credentials c ON c.user_id = u.id WHERE LOWER(u.email) = LOWER(?) LIMIT 1",
            [$identifier]
        );
        return $row ?: null;
    }

    /**
     * POST /auth/login — identifier (email or username) + password, no merchant
     */
    public function login(array $data): array
    {
        $identifier = $this->extractIdentifier($data);
        $password = $data['password'] ?? '';

        if (empty($identifier) || empty($password)) {
            throw new AuthException('Missing identifier or password');
        }

        // Find by identifier (user_id or email) — merpati parity, no merchant
        $userRow = $this->findUserByIdentifier($identifier);

        if (!$userRow) {
            throw new AuthException('Account does not exist. Please check your email or username or sign up.');
        }

        $storedHash = $userRow['password'] ?? '';
        $userId = $userRow['user_id'];
        $inputHash = md5($password);

        if (empty($storedHash)) throw new AuthException('Account has no password set.');

        // Backward compatibility: check md5 first, then bcrypt
        if ($inputHash !== $storedHash && !password_verify($password, $storedHash)) {
            throw new AuthException('Wrong password. Please try again.');
        }

        // Migrate to bcrypt if was md5
        if ($inputHash === $storedHash) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $this->db->update('user_credentials', ['password_hash' => $newHash], 'user_id = ?', [$userId]);
        }

        // Get user profile (now single-table users with id PK)
        $profile = $this->db->fetchOne(
            "SELECT id, username, nickname, email, avatar FROM users WHERE id = ?",
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
            'id' => $userId,
            'user_id' => $userId,
            'username' => $profile['username'] ?? '',
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

        // business_profile.user_id is now CHAR(36) UUID (1-go baseline)
        try {
            $hasProfile = $this->db->fetchOne(
                "SELECT id FROM business_profile WHERE user_id = ?",
                [$userId]
            );
        } catch (\Throwable $e) { $hasProfile = null; }

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
        $userId = $data['user_id'] ?? $data['id'] ?? '';

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

    /**
     * Change password — blocks immediate reuse (Option A, no history table).
     * Expects: current_password, new_password
     */
    public function changePassword(string $userId, array $data): array
    {
        $current = $data['current_password'] ?? $data['password'] ?? '';
        $new = $data['new_password'] ?? '';
        if (empty($current) || empty($new)) throw new AuthException('Missing password fields');
        if (strlen($new) < 6) throw new AuthException('New password too short');

        $row = $this->db->fetchOne("SELECT password_hash FROM user_credentials WHERE user_id = ?", [$userId]);
        // Legacy fallback: if credentials row missing, try users.password (old DB)
        if (!$row) $row = $this->db->fetchOne("SELECT password as password_hash FROM users WHERE id = ? OR username = ? OR email = ?", [$userId, $userId, $userId]);
        if (!$row) throw new AuthException('Credentials not found');
        $hash = $row['password_hash'] ?? $row['password'] ?? '';
        if (!password_verify($current, $hash) && md5($current) !== $hash) throw new AuthException('Current password incorrect');
        // Block reuse of current password (Google-like immediate)
        if (password_verify($new, $hash) || md5($new) === $hash) throw new AuthException('Cannot reuse current password');
        $newHash = password_hash($new, PASSWORD_DEFAULT);
        $exists = $this->db->fetchOne("SELECT user_id FROM user_credentials WHERE user_id = ?", [$userId]);
        if ($exists) $this->db->update('user_credentials', ['password_hash' => $newHash], 'user_id = ?', [$userId]);
        else $this->db->insert('user_credentials', ['user_id' => $userId, 'password_hash' => $newHash]);
        return ['success' => true];
    }
}
