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
    public function __construct(private Database $db) {}

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

        // Check if already friends or request exists
        $existing = $this->db->fetchOne(
            "SELECT id FROM friends 
             WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)
             AND approved != 1",
            [$userId, $toUserId, $toUserId, $userId]
        );

        if ($existing) {
            throw new ValidationException('Friend request already sent or accepted');
        }

        try {
            $this->db->insert('friends', [
                'user_id1' => $userId,
                'user_id2' => $toUserId,
                'approved' => 0,
            ]);
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
            $this->db->update(
                'friends',
                ['approved' => 1],
                '(user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)',
                [$userId, $otherUserId, $otherUserId, $userId]
            );
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
        return $this->db->fetchAll(
            "SELECT f.*, u.nickname, u.avatar 
             FROM friends f
             JOIN users u ON f.user_id1 = ? AND f.user_id2 = u.user_id
             WHERE f.user_id2 = ? AND f.approved = 0",
            [$userId, $userId]
        );
    }

    /**
     * Get sent friend requests.
     */
    public function getSentRequests(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT f.*, u.nickname, u.avatar 
             FROM friends f
             JOIN users u ON f.user_id2 = ? AND u.user_id = f.user_id1
             WHERE f.user_id1 = ? AND f.approved = 0",
            [$userId, $userId]
        );
    }

    /**
     * Get friends list.
     */
    public function getFriends(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT u.user_id, u.nickname, u.avatar 
             FROM friends f
             JOIN users u ON (f.user_id1 = ? AND f.user_id2 = u.user_id) OR (f.user_id2 = ? AND f.user_id1 = u.user_id)
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

        $row = $this->db->fetchOne(
            "SELECT approved FROM friends 
             WHERE ((user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?))
             AND approved = 1",
            [$userId, $otherUserId, $otherUserId, $userId]
        );

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
            $this->db->delete(
                'friends',
                '((user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)) AND approved = 1',
                [$userId, $otherUserId, $otherUserId, $userId]
            );
        } catch (\Exception $e) {
            throw new \RuntimeException('Failed to remove friend: ' . $e->getMessage());
        }

        return ['success' => true];
    }
}
