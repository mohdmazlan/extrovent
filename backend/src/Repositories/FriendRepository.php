<?php

namespace Extrovent\Repositories;

use Extrovent\Database\Database;

/**
 * Friend repository - handles all database operations for friendships.
 */
class FriendRepository
{
    public function __construct(private Database $db) {}

    public function sendRequest(string $fromUserId, string $toUserId): int
    {
        return $this->db->insert('outdoorbuddy_friends', [
            'user_id1' => $fromUserId,
            'user_id2' => $toUserId,
            'approved' => 0,
        ]);
    }

    public function hasPendingRequest(string $fromUserId, string $toUserId): bool
    {
        $row = $this->db->fetchOne(
            "SELECT id FROM outdoorbuddy_friends 
             WHERE (user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)
             AND approved != 1",
            [$fromUserId, $toUserId, $toUserId, $fromUserId]
        );
        return (bool) $row;
    }

    public function getPendingRequests(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT f.*, u.nickname, u.avatar 
             FROM outdoorbuddy_friends f
             JOIN outdoorbuddy_users u ON f.user_id1 = ? AND f.user_id2 = u.user_id
             WHERE f.user_id2 = ? AND f.approved = 0",
            [$userId, $userId]
        );
    }

    public function getSentRequests(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT f.*, u.nickname, u.avatar 
             FROM outdoorbuddy_friends f
             JOIN outdoorbuddy_users u ON f.user_id2 = ? AND u.user_id = f.user_id1
             WHERE f.user_id1 = ? AND f.approved = 0",
            [$userId, $userId]
        );
    }

    public function acceptRequest(string $userId1, string $userId2): int
    {
        return $this->db->update(
            'outdoorbuddy_friends',
            ['approved' => 1],
            '(user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?)',
            [$userId1, $userId2, $userId2, $userId1]
        );
    }

    public function getFriends(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT u.user_id, u.nickname, u.avatar 
             FROM outdoorbuddy_friends f
             JOIN outdoorbuddy_users u ON (f.user_id1 = ? AND f.user_id2 = u.user_id) OR (f.user_id2 = ? AND f.user_id1 = u.user_id)
             WHERE f.approved = 1",
            [$userId, $userId]
        );
    }

    public function areFriends(string $userId1, string $userId2): bool
    {
        $row = $this->db->fetchOne(
            "SELECT approved FROM outdoorbuddy_friends 
             WHERE ((user_id1 = ? AND user_id2 = ?) OR (user_id1 = ? AND user_id2 = ?))
             AND approved = 1",
            [$userId1, $userId2, $userId2, $userId1]
        );
        return (bool) $row;
    }
}
