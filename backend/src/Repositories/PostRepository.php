<?php

namespace Extrovent\Repositories;

use Extrovent\Database\Database;

/**
 * Post repository - handles all database operations for posts.
 */
class PostRepository
{
    public function __construct(private Database $db) {}

    public function create(array $data): int
    {
        return $this->db->insert('posts', [
            'caption' => $data['caption'] ?? '',
            'banner' => $data['banner'] ?? '',
            'user_id' => $data['user_id'],
            'place_id' => $data['place_id'] ?? null,
            'event_id' => $data['event_id'] ?? null,
            'activity_id' => $data['activity_id'] ?? null,
        ]);
    }

    public function getAll(array $filters = [], int $page = 1): array
    {
        $LIMIT = 20;
        $offset = ($page - 1) * $LIMIT;

        $sql = "SELECT 
                    (SELECT COUNT(*) FROM post_comment WHERE posts.post_id = post_id) AS total_comment,
                    (SELECT COUNT(*) FROM post_like WHERE posts.post_id = post_id) AS total_likes,
                    p.post_id, p.banner, NOW() AS timeNow, p.date_cr8 AS date, 
                    p.caption, p.type, pl.user_id AS sliked,
                    u.nickname, u.avatar, u.user_id
                FROM posts p
                LEFT JOIN post_like pl ON p.post_id = pl.post_id AND pl.user_id = ?
                LEFT JOIN users u ON u.user_id = p.user_id";

        $params = ['?' => $filters['current_user'] ?? ''];

        // Place filter
        if (!empty($filters['place_id'])) {
            $sql .= " AND p.place_id = ?";
            $params[] = $filters['place_id'];
        }

        // Activity filter
        if (!empty($filters['activity_id'])) {
            $sql .= " AND p.activity_id = ?";
            $params[] = $filters['activity_id'];
        }

        // User filter
        if (!empty($filters['filter_user_id'])) {
            $sql .= " AND p.user_id = ?";
            $params[] = $filters['filter_user_id'];
        }

        // Datetime pagination
        if (!empty($filters['datetime'])) {
            $sql .= " AND p.last_update <= ?";
            $params[] = $filters['datetime'];
        }

        $sql .= " GROUP BY p.post_id ORDER BY p.last_update DESC LIMIT ?, ?";
        $params[] = $offset;
        $params[] = $LIMIT;

        return $this->db->fetchAll($sql, array_values($params));
    }

    public function getById(int $postId): ?array
    {
        return $this->db->fetchOne(
            "SELECT p.*, (SELECT COUNT(*) FROM post_comment WHERE post_id = p.post_id) AS total_comment,
                     (SELECT COUNT(*) FROM post_like WHERE post_id = p.post_id) AS total_likes
              FROM posts p 
              WHERE p.post_id = ?",
            [$postId]
        );
    }

    public function getByUserId(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT p.*, (SELECT COUNT(*) FROM post_comment WHERE post_id = p.post_id) AS total_comment,
                     (SELECT COUNT(*) FROM post_like WHERE post_id = p.post_id) AS total_likes
              FROM posts p 
              WHERE p.user_id = ? 
              ORDER BY p.last_update DESC",
            [$userId]
        );
    }

    public function getOwner(int $postId): ?string
    {
        $row = $this->db->fetchOne(
            "SELECT user_id FROM posts WHERE post_id = ?",
            [$postId]
        );
        return $row['user_id'] ?? null;
    }

    public function getComments(int $postId): array
    {
        return $this->db->fetchAll(
            "SELECT c.*, u.nickname, u.avatar 
             FROM post_comment c 
             JOIN users u ON c.user_id = u.user_id 
             WHERE c.post_id = ? 
             ORDER BY c.datetime ASC",
            [$postId]
        );
    }

    public function addComment(int $postId, string $userId, string $comment): int
    {
        return $this->db->insert('post_comment', [
            'post_id' => $postId,
            'user_id' => $userId,
            'comment' => $comment,
        ]);
    }

    public function likePost(int $postId, string $userId): void
    {
        $this->db->insert('post_like', [
            'post_id' => $postId,
            'user_id' => $userId,
        ]);
    }

    public function unlikePost(int $postId, string $userId): void
    {
        $this->db->delete(
            'post_like',
            'post_id = ? AND user_id = ?',
            [$postId, $userId]
        );
    }

    public function isLiked(int $postId, string $userId): bool
    {
        $row = $this->db->fetchOne(
            "SELECT id FROM post_like WHERE post_id = ? AND user_id = ?",
            [$postId, $userId]
        );
        return (bool) $row;
    }

    public function getImages(int $postId): array
    {
        return array_map(fn($img) => $img['image_url'], $this->db->fetchAll(
            "SELECT image_url FROM post_image WHERE post_id = ?",
            [$postId]
        ));
    }

    public function deleteImages(int $postId): int
    {
        return $this->db->delete('post_image', 'post_id = ?', [$postId]);
    }

    public function deleteLikes(int $postId): int
    {
        return $this->db->delete('post_like', 'post_id = ?', [$postId]);
    }

    public function deleteComments(int $postId): int
    {
        return $this->db->delete('post_comment', 'post_id = ?', [$postId]);
    }
}
