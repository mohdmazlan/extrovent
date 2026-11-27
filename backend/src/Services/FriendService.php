<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Exceptions\ValidationException;
use Extrovent\Exceptions\BusinessLogicException;

/**
 * Friend service - handles friend business logic.
 */
class FriendService
{
    /** @var array<string,bool> */
    private array $uuidCache = [];

    public function __construct(private Database $db) {}

    private function hasUuidColumn(string $table, string $col): bool
    {
        $key = $table . '.' . $col;
        if (array_key_exists($key, $this->uuidCache)) {
            return $this->uuidCache[$key];
        }
        try {
            $row = $this->db->fetchOne(
                "SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                [$table, $col]
            );
            $has = $row && (int)($row['c'] ?? 0) > 0;
        } catch (\Throwable $e) {
            $has = false;
        }
        $this->uuidCache[$key] = (bool)$has;
        return (bool)$has;
    }

    /**
     * Send a friend request.
     */
    public function sendRequest(string $userId, array $data): array
    {
        $toUserId = $data['user_id_2'] ?? '';

        if (empty($toUserId)) {
            throw new ValidationException('Recipient user ID is required');
        }

        if ($userId === $toUserId) {
            throw new ValidationException('Cannot send friend request to yourself');
        }

        // Check if already friends or request exists - support both old and new columns
        $hasUuid1 = $this->hasUuidColumn('friends', 'user_uuid1');
        $hasUuid2 = $this->hasUuidColumn('friends', 'user_uuid2');
        if ($hasUuid1 && $hasUuid2) {
            $existing = $this->db->fetchOne(
                "SELECT id FROM friends 
                 WHERE ((user_id1 = ? OR user_uuid1 = ?) AND (user_id2 = ? OR user_uuid2 = ?) OR (user_id1 = ? OR user_uuid1 = ?) AND (user_id2 = ? OR user_uuid2 = ?))
                 AND approved != 1",
                [$userId, $userId, $toUserId, $toUserId, $toUserId, $toUserId, $userId, $userId]
            );
        } else {
            $existing = $this->db->fetchOne(
                "SELECT id FROM friends 
                 WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)
                 AND approved != 1",
                [$userId, $toUserId, $toUserId, $userId]
            );
        }

        if ($existing) {
            throw new ValidationException('Friend request already sent or accepted');
        }

        try {
            $insert = [
                'user_id1' => $userId,
                'user_id2' => $toUserId,
                'approved' => '0',
                'datetime' => date('Y-m-d H:i:s'),
            ];
            if ($hasUuid1) {
                $insert['user_uuid1'] = $userId;
            }
            if ($hasUuid2) {
                $insert['user_uuid2'] = $toUserId;
            }
            $this->db->insert('friends', $insert);
        } catch (\Exception $e) {
            throw new \RuntimeException('Failed to send friend request: ' . $e->getMessage());
        }

        return ['success' => true];
    }

    /**
     * Accept a friend request.
     */
    public function acceptRequest(string $userId, array $data): array
    {
        $otherUserId = $data['user_id_2'] ?? '';

        if (empty($otherUserId)) {
            throw new ValidationException('User ID is required');
        }

        try {
            $hasUuid1 = $this->hasUuidColumn('friends', 'user_uuid1');
            $hasUuid2 = $this->hasUuidColumn('friends', 'user_uuid2');
            if ($hasUuid1 && $hasUuid2) {
                $this->db->update(
                    'friends',
                    ['approved' => '1'],
                    '((user_id1 = ? OR user_uuid1 = ?) AND (user_id2 = ? OR user_uuid2 = ?) OR (user_id1 = ? OR user_uuid1 = ?) AND (user_id2 = ? OR user_uuid2 = ?))',
                    [$userId, $userId, $otherUserId, $otherUserId, $otherUserId, $otherUserId, $userId, $userId]
                );
            } else {
                $this->db->update(
                    'friends',
                    ['approved' => '1'],
                    '(user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)',
                    [$userId, $otherUserId, $otherUserId, $userId]
                );
            }
        } catch (\Exception $e) {
            throw new \RuntimeException('Failed to accept friend request: ' . $e->getMessage());
        }

        return ['success' => true];
    }

    /**
     * Get pending friend requests.
     */
    public function getPendingRequests(string $userId): array
    {
        $hasUuid2 = $this->hasUuidColumn('friends', 'user_uuid2');
        if ($hasUuid2) {
            return $this->db->fetchAll(
                "SELECT f.*, u.nickname, u.avatar 
                 FROM friends f
                 JOIN users u ON f.user_id1 = u.id
                 WHERE (f.user_id2 = ? OR f.user_uuid2 = ?) AND f.approved = 0",
                [$userId, $userId]
            );
        }
        return $this->db->fetchAll(
            "SELECT f.*, u.nickname, u.avatar 
             FROM friends f
             JOIN users u ON f.user_id1 = ? AND f.user_id2 = u.id
             WHERE f.user_id2 = ? AND f.approved = 0",
            [$userId, $userId]
        );
    }

    /**
     * Get sent friend requests.
     */
    public function getSentRequests(string $userId): array
    {
        $hasUuid1 = $this->hasUuidColumn('friends', 'user_uuid1');
        if ($hasUuid1) {
            return $this->db->fetchAll(
                "SELECT f.*, u.nickname, u.avatar 
                 FROM friends f
                 JOIN users u ON f.user_id2 = u.id
                 WHERE (f.user_id1 = ? OR f.user_uuid1 = ?) AND f.approved = 0",
                [$userId, $userId]
            );
        }
        return $this->db->fetchAll(
            "SELECT f.*, u.nickname, u.avatar 
             FROM friends f
             JOIN users u ON f.user_id2 = ? AND u.id = f.user_id1
             WHERE f.user_id1 = ? AND f.approved = 0",
            [$userId, $userId]
        );
    }

    /**
     * Get friends list.
     */
    public function getFriends(string $userId): array
    {
        $hasUuid1 = $this->hasUuidColumn('friends', 'user_uuid1');
        $hasUuid2 = $this->hasUuidColumn('friends', 'user_uuid2');
        if ($hasUuid1 && $hasUuid2) {
            return $this->db->fetchAll(
                "SELECT u.id, u.nickname, u.avatar 
                 FROM friends f
                 JOIN users u ON ((f.user_id1 = ? OR f.user_uuid1 = ?) AND f.user_id2 = u.id) OR ((f.user_id2 = ? OR f.user_uuid2 = ?) AND f.user_id1 = u.id)
                 WHERE f.approved = 1",
                [$userId, $userId, $userId, $userId]
            );
        }
        return $this->db->fetchAll(
            "SELECT u.id, u.nickname, u.avatar 
             FROM friends f
             JOIN users u ON (f.user_id1 = ? AND f.user_id2 = u.id) OR (f.user_id2 = ? AND f.user_id1 = u.id)
             WHERE f.approved = 1",
            [$userId, $userId]
        );
    }

    /**
     * Check if two users are friends.
     */
    public function areFriends(string $userId, array $data): bool
    {
        $otherUserId = $data['user_id_2'] ?? '';

        if (empty($otherUserId)) {
            throw new ValidationException('User ID is required');
        }

        $hasUuid1 = $this->hasUuidColumn('friends', 'user_uuid1');
        $hasUuid2 = $this->hasUuidColumn('friends', 'user_uuid2');
        if ($hasUuid1 && $hasUuid2) {
            $row = $this->db->fetchOne(
                "SELECT approved FROM friends 
                 WHERE (((user_id1 = ? OR user_uuid1 = ?) AND (user_id2 = ? OR user_uuid2 = ?)) OR ((user_id1 = ? OR user_uuid1 = ?) AND (user_id2 = ? OR user_uuid2 = ?)))
                 AND approved = 1",
                [$userId, $userId, $otherUserId, $otherUserId, $otherUserId, $otherUserId, $userId, $userId]
            );
        } else {
            $row = $this->db->fetchOne(
                "SELECT approved FROM friends 
                 WHERE ((user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?))
                 AND approved = 1",
                [$userId, $otherUserId, $otherUserId, $userId]
            );
        }

        return (bool) $row;
    }

    /**
     * Remove a friend.
     */
    public function removeFriend(string $userId, array $data): array
    {
        $otherUserId = $data['user_id_2'] ?? '';

        if (empty($otherUserId)) {
            throw new ValidationException('User ID is required');
        }

        try {
            $hasUuid1 = $this->hasUuidColumn('friends', 'user_uuid1');
            $hasUuid2 = $this->hasUuidColumn('friends', 'user_uuid2');
            if ($hasUuid1 && $hasUuid2) {
                $this->db->delete(
                    'friends',
                    '(((user_id1 = ? OR user_uuid1 = ?) AND (user_id2 = ? OR user_uuid2 = ?)) OR ((user_id1 = ? OR user_uuid1 = ?) AND (user_id2 = ? OR user_uuid2 = ?))) AND approved = 1',
                    [$userId, $userId, $otherUserId, $otherUserId, $otherUserId, $otherUserId, $userId, $userId]
                );
            } else {
                $this->db->delete(
                    'friends',
                    '((user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)) AND approved = 1',
                    [$userId, $otherUserId, $otherUserId, $userId]
                );
            }
        } catch (\Exception $e) {
            throw new \RuntimeException('Failed to remove friend: ' . $e->getMessage());
        }

        return ['success' => true];
    }
}
