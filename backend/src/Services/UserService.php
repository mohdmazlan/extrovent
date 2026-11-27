<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Exceptions\ValidationException;

class UserService
{
    public function __construct(private Database $db) {}

    private function genId(): string
    {
        $b = random_bytes(16);
        $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
        $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
        $h = bin2hex($b);
        return sprintf('%s-%s-%s-%s-%s', substr($h,0,8), substr($h,8,4), substr($h,12,4), substr($h,16,4), substr($h,20,12));
    }

    public function signup(array $data): array
    {
        $missing = [];
        foreach (['username', 'email', 'password'] as $field) {
            // backward compat: accept user_id as username (client alias)
            $v = $data[$field] ?? $data['user_id'] ?? '';
            if (empty($v)) $missing[] = $field;
        }
        if ($missing) throw new ValidationException("Please fill all required fields: " . implode(', ', $missing));
        $username = trim($data['username'] ?? $data['user_id'] ?? '');
        $email = strtolower(preg_replace('/\s+/', '', $data['email']));
        $password = $data['password'];
        $confirmPassword = $data['confirm_password'] ?? '';
        if ($password !== $confirmPassword) throw new ValidationException('Passwords did not match');
        if (strlen($password) < 6) throw new ValidationException('Password length cannot be less than 6');
        // check uniqueness on username/email
        if ($this->db->fetchOne("SELECT id FROM users WHERE username = ? OR email = ?", [$username, $email])) {
            throw new ValidationException('Username or email already exists');
        }
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $id = $this->genId();
        try {
            $gender = trim($data['gender'] ?? '');
            if (!in_array(strtolower($gender), ['m', 'f'])) $gender = 'm';
            $now = date('Y-m-d H:i:s');
            $this->db->insert('users', [
                'id' => $id,
                'username' => $username,
                'nickname' => trim($data['nickname'] ?? $username),
                'email' => $email,
                'first_name' => trim($data['first_name'] ?? ''),
                'last_name' => trim($data['last_name'] ?? ''),
                'no_phone' => trim($data['no_phone'] ?? ''),
                'avatar' => null,
                'gender' => $gender,
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
                'signup' => $now,
                'lastlogin' => $now,
                'lastseen' => $now,
            ]);
            $this->db->insert('user_credentials', [
                'user_id' => $id,
                'password_hash' => $hashedPassword,
            ]);
            $uploadDir = __DIR__ . '/../../storage';
            if (!is_dir($uploadDir . "/{$id}")) mkdir($uploadDir . "/{$id}", 0755, true);
            return ['id' => $id, 'user_id' => $id, 'username' => $username, 'success' => true];
        } catch (\PDOException $e) {
            $code = (int) ($e->errorInfo[1] ?? 0);
            if ($code === 1062) {
                if (stripos($e->getMessage(), 'email') !== false) throw new \RuntimeException('Email already registered');
                if (stripos($e->getMessage(), 'username') !== false) throw new \RuntimeException('Username already exists');
                throw new \RuntimeException('This account already exists');
            }
            error_log("Registration database error: " . $e->getMessage());
            throw new \RuntimeException('Registration failed. Please try again later.');
        } catch (\Exception $e) {
            throw new \RuntimeException('Registration failed. Please try again later.');
        }
    }

    public function getProfile(string $userId): ?array
    {
        // Single-table lookup by id, username, or email (schema.sql is the single source)
        $row = $this->db->fetchOne("SELECT * FROM users WHERE id = ?", [$userId]);
        if (!$row) $row = $this->db->fetchOne("SELECT * FROM users WHERE username = ?", [$userId]);
        if (!$row) $row = $this->db->fetchOne("SELECT * FROM users WHERE email = ?", [$userId]);
        return $row;
    }

    public function viewUser(array $data): array
    {
        $targetId = trim($data['user_id'] ?? $data['id'] ?? $data['username'] ?? '');
        if ($targetId === '') throw new ValidationException('Missing user_id');
        // Try id, username, email
        $row = $this->db->fetchOne(
            "SELECT u.id, u.username, u.nickname, u.email, u.avatar, u.gender, u.signup, u.lastlogin, u.first_name, u.last_name, u.no_phone,
                    (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS total_posts,
                    (SELECT COUNT(*) FROM friends WHERE (user_id1 = u.id OR user_id1 = u.username OR user_id2 = u.id OR user_id2 = u.username) AND approved = '1') AS total_friends
             FROM users u WHERE u.id = ? OR u.username = ? OR u.email = ? LIMIT 1",
            [$targetId, $targetId, $targetId]
        );
        // Legacy fallback removed — schema.sql has no user_id column or user_details table
        if (!$row) throw new \Extrovent\Exceptions\NotFoundException('User not found');
        // Normalize fields for frontend
        $row['user_id'] = $row['id'] ?? $row['user_id'] ?? $targetId;
        return $row;
    }

    public function updateProfile(string $userId, array $data): array
    {
        $allowed = ['nickname', 'email', 'username', 'first_name', 'last_name', 'no_phone'];
        $updateData = [];
        foreach ($allowed as $f) if (isset($data[$f]) && $data[$f] !== '') $updateData[$f] = trim($data[$f]);
        if (empty($updateData)) throw new ValidationException('No valid fields to update');
        // Resolve UUID id from username if needed
        $id = $userId;
        $exists = $this->db->fetchOne("SELECT id FROM users WHERE id = ?", [$userId]);
        if (!$exists) {
            $byUsername = $this->db->fetchOne("SELECT id FROM users WHERE username = ?", [$userId]);
            if ($byUsername) $id = $byUsername['id'];
        }
        $affected = $this->db->update('users', $updateData, 'id = ?', [$id]);
        if (!$affected) throw new \RuntimeException('Update failed');
        return ['success' => true];
    }

    public function updateAvatar(string $userId, array $data): array
    {
        $avatarUrl = $data['avatar'] ?? '';
        if (empty($avatarUrl)) throw new ValidationException('Avatar URL is required');
        $id = $userId;
        $exists = $this->db->fetchOne("SELECT id FROM users WHERE id = ?", [$userId]);
        if (!$exists) {
            $byUsername = $this->db->fetchOne("SELECT id FROM users WHERE username = ?", [$userId]);
            if ($byUsername) $id = $byUsername['id'];
        }
        $this->db->update('users', ['avatar' => $avatarUrl], 'id = ?', [$id]);
        return ['success' => true, 'avatar' => $avatarUrl];
    }

    public function searchUsers(string $query, int $limit = 20): array
    {
        $search = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $query) . '%';
        return $this->db->fetchAll(
            "SELECT id, username, nickname, avatar, email FROM users WHERE nickname LIKE ? OR username LIKE ? OR email LIKE ? LIMIT ?",
            [$search, $search, $search, $limit]
        );
    }

    public function getAllUsers(): array
    {
        return $this->db->fetchAll("SELECT id, username, nickname, avatar, email FROM users ORDER BY signup DESC");
    }

    public function getContacts(string $userId): array
    {
        // Support both new UUID and old username FKs in friends
        return $this->db->fetchAll(
            "SELECT u.id, u.username, u.nickname, u.avatar FROM friends f JOIN users u ON (f.user_id1 = ? AND f.user_id2 = u.id) OR (f.user_id2 = ? AND f.user_id1 = u.id) OR (f.user_id1 = u.username) OR (f.user_id2 = u.username) WHERE f.approved = '1'",
            [$userId, $userId, $userId, $userId]
        );
    }
}
