<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Exceptions\ValidationException;

/**
 * User service - handles user business logic.
 */
class UserService
{
    public function __construct(private Database $db) {}

    /**
     * Register a new user.
     */
    public function signup(array $data): array
    {
        // Validate required fields
        $missing = [];
        foreach (['user_id', 'email', 'password'] as $field) {
            if (empty($data[$field])) {
                $missing[] = $field;
            }
        }

        if ($missing) {
            throw new ValidationException("Please fill all required fields: " . implode(', ', $missing));
        }

        $userId = trim($data['user_id']);
        $email = strtolower(preg_replace('/\s+/', '', $data['email']));
        $password = $data['password'];
        $confirmPassword = $data['confirm_password'] ?? '';

        // Validate passwords match
        if ($password !== $confirmPassword) {
            throw new ValidationException('Passwords did not match');
        }

        // Password length check
        if (strlen($password) < 6) {
            throw new ValidationException('Password length cannot be less than 6');
        }

        // Check if user_id already exists
        if ($this->db->fetchOne(
            "SELECT user_id FROM outdoorbuddy_users WHERE user_id = ?",
            [$userId]
        )) {
            throw new ValidationException('User ID already exists');
        }

        // Hash password with bcrypt
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        try {
            // Insert user details table first (empty record)
            $this->db->insert('outdoorbuddy_user_details', ['user_id' => $userId]);

            // Insert user
            $gender = trim($data['gender'] ?? '');
            if (!in_array(strtolower($gender), ['m', 'f'])) {
                $gender = 'm'; // Default to 'm' if not provided or invalid
            }
            
            $now = date('Y-m-d H:i:s');
            $this->db->insert('outdoorbuddy_users', [
                'user_id' => $userId,
                'nickname' => trim($data['nickname'] ?? ''),
                'email' => $email,
                'password' => $hashedPassword,
                'gender' => $gender,
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
                'signup' => $now,
                'lastlogin' => $now,
                'lastseen' => $now,
            ]);

            // Create user folder for uploads (legacy compatibility)
            $uploadDir = __DIR__ . '/../../uploads';
            if (!is_dir($uploadDir . "/{$userId}")) {
                mkdir($uploadDir . "/{$userId}", 0755, true);
            }

            return ['user_id' => $userId, 'success' => true];
        } catch (\PDOException $e) {
            // Handle specific database errors with user-friendly messages
            $code = (int) ($e->errorInfo[1] ?? 0);
            
            switch ($code) {
                case 1062: // Duplicate entry
                    if (strpos($e->getMessage(), 'email') !== false || strpos($e->getMessage(), 'Email') !== false) {
                        throw new \RuntimeException('Email already registered');
                    }
                    if (strpos($e->getMessage(), 'user_id') !== false || strpos($e->getMessage(), 'User ID') !== false) {
                        throw new \RuntimeException('User ID already exists');
                    }
                    // Fallback for other duplicate errors
                    throw new \RuntimeException('This account already exists');
                default:
                    // Log the actual error for debugging (not exposed to user)
                    error_log("Registration database error: " . $e->getMessage());
                    throw new \RuntimeException('Registration failed. Please try again later.');
            }
        } catch (\Exception $e) {
            throw new \RuntimeException('Registration failed. Please try again later.');
        }
    }

    /**
     * Get user profile.
     */
    public function getProfile(string $userId): ?array
    {
        return $this->db->fetchOne(
            "SELECT u.nickname, u.avatar, u.email, ud.* 
             FROM outdoorbuddy_users u
             LEFT JOIN outdoorbuddy_user_details ud ON u.user_id = ud.user_id
             WHERE u.user_id = ?",
            [$userId]
        );
    }

    /**
     * Update user profile.
     */
    public function updateProfile(string $userId, array $data): array
    {
        $allowed = ['nickname', 'email', 'first_name', 'last_name', 'no_ic', 'no_matrik', 'no_phone'];
        $updateData = [];

        foreach ($allowed as $field) {
            if (isset($data[$field]) && $data[$field] !== '') {
                $updateData[$field] = trim($data[$field]);
            }
        }

        if (empty($updateData)) {
            throw new ValidationException('No valid fields to update');
        }

        $affected = $this->db->update('outdoorbuddy_users', $updateData, 'user_id = ?', [$userId]);

        if (!$affected) {
            throw new \RuntimeException('Update failed');
        }

        return ['success' => true];
    }

    /**
     * Update user avatar.
     */
    public function updateAvatar(string $userId, array $data): array
    {
        $avatarUrl = $data['avatar'] ?? '';
        if (empty($avatarUrl)) {
            throw new ValidationException('Avatar URL is required');
        }

        $this->db->update('outdoorbuddy_users', ['avatar' => $avatarUrl], 'user_id = ?', [$userId]);
        return ['success' => true, 'avatar' => $avatarUrl];
    }

    /**
     * Search users.
     */
    public function searchUsers(string $query, int $limit = 20): array
    {
        $search = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $query) . '%';
        return $this->db->fetchAll(
            "SELECT user_id, nickname, avatar FROM outdoorbuddy_users 
             WHERE nickname LIKE ? OR email LIKE ? LIMIT ?",
            [$search, $search, $limit]
        );
    }

    /**
     * Get all users.
     */
    public function getAllUsers(): array
    {
        return $this->db->fetchAll(
            "SELECT user_id, nickname, avatar FROM outdoorbuddy_users ORDER BY signup DESC"
        );
    }

    /**
     * Get user contacts (friends).
     */
    public function getContacts(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT u.user_id, u.nickname, u.avatar 
             FROM outdoorbuddy_friends f
             JOIN outdoorbuddy_users u ON (f.user_id1 = ? AND f.user_id2 = u.user_id) OR (f.user_id2 = ? AND f.user_id1 = u.user_id)
             WHERE f.approved = 1",
            [$userId, $userId]
        );
    }
}
