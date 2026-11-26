<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;

/**
 * User Session Service - manages user login sessions.
 */
class UserSessionService
{
    private Database $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    /**
     * Create a new session record after successful login.
     *
     * @param string $userId
     * @param string $ipAddress
     * @param string $deviceInfo
     * @param int $expiresAt Unix timestamp for session expiry
     * @return string The session_id
     */
    public function createSession(string $userId, string $ipAddress, string $deviceInfo = '', int $expiresAt = 0): string
    {
        $sessionId = bin2hex(random_bytes(32));
        $now = date('Y-m-d H:i:s');

        $this->db->insert('user_sessions', [
            'session_id' => $sessionId,
            'user_id' => $userId,
            'ip_address' => $ipAddress,
            'device_info' => $deviceInfo ?: $this->getClientDeviceInfo(),
            'login_at' => $now,
            'last_activity_at' => $now,
            'expires_at' => date('Y-m-d H:i:s', $expiresAt),
            'status' => 'active',
        ]);

        return $sessionId;
    }

    /**
     * Get all active sessions for a user.
     *
     * @param string $userId
     * @return array<int, array<string, mixed>>
     */
    public function getUserSessions(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT session_id, ip_address, device_info, login_at, last_activity_at, expires_at, status 
             FROM user_sessions 
             WHERE user_id = ? AND status = 'active' AND expires_at > NOW()
             ORDER BY login_at DESC",
            [$userId]
        );
    }

    /**
     * Revoke a session (mark as revoked).
     *
     * @param string $sessionId
     * @return bool True if session was found and revoked
     */
    public function revokeSession(string $sessionId): bool
    {
        $result = $this->db->update(
            'user_sessions',
            ['status' => 'revoked'],
            'session_id = ?',
            [$sessionId]
        );

        return (bool) $result;
    }

    /**
     * Revoke all sessions for a user.
     *
     * @param string $userId
     * @return int Number of sessions revoked
     */
    public function revokeAllSessions(string $userId): int
    {
        return $this->db->update(
            'user_sessions',
            ['status' => 'revoked'],
            'user_id = ? AND status = ?',
            [$userId, 'active']
        );
    }

    /**
     * Update last_activity_at for a session.
     *
     * @param string $sessionId
     * @return void
     */
    public function updateActivity(string $sessionId): void
    {
        $this->db->update(
            'user_sessions',
            ['last_activity_at' => date('Y-m-d H:i:s')],
            'session_id = ?',
            [$sessionId]
        );
    }

    /**
     * Clean up expired sessions.
     *
     * @return int Number of sessions cleaned up
     */
    public function cleanupExpiredSessions(): int
    {
        return $this->db->update(
            'user_sessions',
            ['status' => 'expired'],
            'expires_at < NOW() AND status = ?',
            ['active']
        );
    }

    /**
     * Get client device information from request.
     *
     * @return string
     */
    private function getClientDeviceInfo(): string
    {
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        // Truncate to prevent overly long entries
        return substr($userAgent, 0, 255);
    }
}
