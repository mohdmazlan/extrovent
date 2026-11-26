<?php

namespace Extrovent\Repositories;

use Extrovent\Database\Database;

/**
 * User repository - handles all database operations for users.
 */
class UserRepository
{
    public function __construct(private Database $db) {}

    public function findByUserId(string $userId): ?array
    {
        return $this->db->fetchOne(
            "SELECT user_id, nickname, email, avatar, gender, signup, lastlogin FROM users WHERE user_id = ?",
            [$userId]
        );
    }

    public function findByEmail(string $email): ?array
    {
        return $this->db->fetchOne(
            "SELECT * FROM users WHERE email = ?",
            [strtolower($email)]
        );
    }

    public function existsByUserId(string $userId): bool
    {
        $row = $this->db->fetchOne(
            "SELECT user_id FROM users WHERE user_id = ?",
            [$userId]
        );
        return (bool) $row;
    }

    public function create(array $data): int
    {
        return $this->db->insert('users', [
            'user_id' => $data['user_id'],
            'nickname' => $data['nickname'] ?? '',
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'gender' => $data['gender'] ?? '',
            'ip_address' => $data['ip_address'] ?? '',
        ]);
    }

    public function createDetails(string $userId): void
    {
        $this->db->insert('user_details', ['user_id' => $userId]);
    }

    public function updateProfile(string $userId, array $data): int
    {
        return $this->db->update('users', $data, 'user_id = ?', [$userId]);
    }

    public function updateAvatar(string $userId, string $avatarUrl): int
    {
        return $this->db->update('users', ['avatar' => $avatarUrl], 'user_id = ?', [$userId]);
    }

    public function searchUsers(string $query, int $limit = 20): array
    {
        $search = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $query) . '%';
        return $this->db->fetchAll(
            "SELECT user_id, nickname, avatar FROM users 
             WHERE nickname LIKE ? OR email LIKE ? LIMIT ?",
            [$search, $search, $limit]
        );
    }

    public function getAllUsers(): array
    {
        return $this->db->fetchAll(
            "SELECT user_id, nickname, avatar FROM users ORDER BY signup DESC"
        );
    }

    public function getProfile(string $userId): ?array
    {
        return $this->db->fetchOne(
            "SELECT u.nickname, u.avatar, u.email, ud.* 
             FROM users u
             LEFT JOIN user_details ud ON u.user_id = ud.user_id
             WHERE u.user_id = ?",
            [$userId]
        );
    }

    public function getContacts(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT u.user_id, u.nickname, u.avatar 
             FROM friends f
             JOIN users u ON (f.user_id1 = ? AND f.user_id2 = u.user_id) OR (f.user_id2 = ? AND f.user_id1 = u.user_id)
             WHERE f.approved = 1",
            [$userId, $userId]
        );
    }

    public function updatePassword(string $userId, string $hashedPassword): int
    {
        return $this->db->update('users', ['password' => $hashedPassword], 'user_id = ?', [$userId]);
    }
}
