<?php

namespace Extrovent\Middleware;

use Extrovent\Database\Database;

/**
 * Rate Limiting Middleware - slows down brute-force login attempts
 * without punishing legitimate users.
 *
 * Facebook/Instagram-style approach:
 * - Generous thresholds, short progressive cooldowns instead of hard lockouts
 * - Per-account tracking (one shared IP doesn't punish everyone)
 * - Per-IP safety net with a high threshold (catches bots hammering many accounts)
 * - "Attempts remaining" warnings before any friction kicks in
 * - Any successful login resets all counters for that IP + account
 */
class RateLimitMiddleware
{
    private Database $db;

    // Per-IP safety net: only bots hit this (shared NAT friendly)
    private int $ipMaxAttempts;
    private int $ipWindowSeconds;

    // Per-account progressive friction (consecutive failures in window)
    private int $acctWindowSeconds;

    /**
     * Cooldown ladder: [failures => cooldown seconds].
     * Kept short on purpose — friction, not punishment.
     */
    private array $cooldownLadder = [
        12 => 1800, // 12+ fails  -> 30 min cooldown
        8 => 300,   // 8+ fails   -> 5 min cooldown
        5 => 60,    // 5+ fails   -> 60 sec cooldown
    ];

    /** Warn when this many attempts remain before first cooldown. */
    private int $warnThreshold = 2;

    public function __construct(
        Database $db,
        int $ipMaxAttempts = 30,
        int $ipWindowSeconds = 900, // 15 minutes
        int $acctWindowSeconds = 900 // 15 minutes
    ) {
        $this->db = $db;
        $this->ipMaxAttempts = $ipMaxAttempts;
        $this->ipWindowSeconds = $ipWindowSeconds;
        $this->acctWindowSeconds = $acctWindowSeconds;
    }

    /**
     * Check if a login attempt is allowed.
     *
     * @param string $ip The client IP address
     * @param string|null $userId The account being targeted (null if unknown)
     * @return array{allowed: bool, attempts: int, remaining: int, retry_after: int, scope: string}
     */
    public function checkRateLimit(string $ip, ?string $userId = null): array
    {
        $this->cleanupOldEntries($ip, $userId);

        // 1) Per-IP safety net (bots cycling many accounts)
        $ipAttempts = $this->countIpAttempts($ip);
        if ($ipAttempts >= $this->ipMaxAttempts) {
            return [
                'allowed' => false,
                'attempts' => $ipAttempts,
                'remaining' => 0,
                'retry_after' => $this->ipRetryAfter($ip),
                'scope' => 'ip',
            ];
        }

        // 2) Per-account progressive cooldown
        if ($userId !== null && $userId !== '') {
            $acctAttempts = $this->countAccountAttempts($userId);
            $cooldown = $this->cooldownFor($acctAttempts);
            if ($cooldown > 0) {
                return [
                    'allowed' => false,
                    'attempts' => $acctAttempts,
                    'remaining' => 0,
                    'retry_after' => $this->accountRetryAfter($userId, $cooldown),
                    'scope' => 'account',
                ];
            }

            $firstRung = $this->firstRung();
            return [
                'allowed' => true,
                'attempts' => $acctAttempts,
                'remaining' => max(0, $firstRung - $acctAttempts),
                'retry_after' => 0,
                'scope' => 'account',
            ];
        }

        // No account identifier (e.g. missing user_id) — fall back to IP count
        return [
            'allowed' => true,
            'attempts' => $ipAttempts,
            'remaining' => max(0, $this->ipMaxAttempts - $ipAttempts),
            'retry_after' => 0,
            'scope' => 'ip',
        ];
    }

    /**
     * Record a failed login attempt.
     * Uses the database clock (NOW()) so writes and window comparisons
     * always share the same clock, regardless of PHP/MySQL timezones.
     */
    public function recordFailedAttempt(string $ip, ?string $userId = null): void
    {
        $this->db->query(
            "INSERT INTO login_attempts (ip_address, user_id, attempted_at) VALUES (?, ?, NOW())",
            [$ip, $userId !== '' ? $userId : null]
        );
    }

    /**
     * Reset all counters for an IP + account (call on successful login).
     */
    public function resetRateLimit(string $ip, ?string $userId = null): void
    {
        $this->db->delete('login_attempts', 'ip_address = ?', [$ip]);
        if ($userId !== null && $userId !== '') {
            $this->db->delete(
                'login_attempts',
                'user_id = ? AND attempted_at > DATE_SUB(NOW(), INTERVAL ? SECOND)',
                [$userId, $this->acctWindowSeconds]
            );
        }
    }

    /**
     * Remaining attempts before the first cooldown kicks in.
     * Used for "N attempts remaining" warnings.
     */
    public function getRemainingAttempts(string $ip, ?string $userId = null): int
    {
        if ($userId !== null && $userId !== '') {
            return max(0, $this->firstRung() - $this->countAccountAttempts($userId));
        }
        return max(0, $this->ipMaxAttempts - $this->countIpAttempts($ip));
    }

    /**
     * Should the client be warned? (True when at or below the warn threshold.)
     */
    public function shouldWarn(int $remaining): bool
    {
        return $remaining <= $this->warnThreshold && $remaining > 0;
    }

    // ---------- internals ----------

    private function firstRung(): int
    {
        return (int) min(array_keys($this->cooldownLadder));
    }

    private function cooldownFor(int $attempts): int
    {
        foreach ($this->cooldownLadder as $threshold => $cooldown) {
            if ($attempts >= $threshold) {
                return $cooldown;
            }
        }
        return 0;
    }

    private function countIpAttempts(string $ip): int
    {
        return (int) $this->db->fetchColumn(
            "SELECT COUNT(*) FROM login_attempts WHERE ip_address = ? AND attempted_at > DATE_SUB(NOW(), INTERVAL ? SECOND)",
            [$ip, $this->ipWindowSeconds]
        );
    }

    private function countAccountAttempts(string $userId): int
    {
        return (int) $this->db->fetchColumn(
            "SELECT COUNT(*) FROM login_attempts WHERE user_id = ? AND attempted_at > DATE_SUB(NOW(), INTERVAL ? SECOND)",
            [$userId, $this->acctWindowSeconds]
        );
    }

    private function ipRetryAfter(string $ip): int
    {
        // Computed on the DB clock so PHP/MySQL timezone skew can't inflate it.
        $seconds = $this->db->fetchColumn(
            "SELECT TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(MIN(attempted_at), INTERVAL ? SECOND)) FROM login_attempts WHERE ip_address = ?",
            [$this->ipWindowSeconds, $ip]
        );
        return max(0, (int) $seconds);
    }

    private function accountRetryAfter(string $userId, int $cooldown): int
    {
        // Computed on the DB clock so PHP/MySQL timezone skew can't inflate it.
        $seconds = $this->db->fetchColumn(
            "SELECT TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(MAX(attempted_at), INTERVAL ? SECOND)) FROM login_attempts WHERE user_id = ?",
            [$cooldown, $userId]
        );
        if ($seconds === null || $seconds === false) {
            return $cooldown;
        }
        return max(0, (int) $seconds);
    }

    private function cleanupOldEntries(string $ip, ?string $userId = null): void
    {
        $this->db->query(
            "DELETE FROM login_attempts WHERE ip_address = ? AND attempted_at <= DATE_SUB(NOW(), INTERVAL ? SECOND)",
            [$ip, $this->ipWindowSeconds]
        );
        if ($userId !== null && $userId !== '') {
            $this->db->query(
                "DELETE FROM login_attempts WHERE user_id = ? AND attempted_at <= DATE_SUB(NOW(), INTERVAL ? SECOND)",
                [$userId, $this->acctWindowSeconds]
            );
        }
    }
}
