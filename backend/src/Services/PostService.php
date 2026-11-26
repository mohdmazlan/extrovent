<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Exceptions\BusinessLogicException;

/**
 * Post service - handles post business logic.
 */
class PostService
{
    public function __construct(private Database $db) {}

    /**
     * Create a new post.
     */
    public function create(string $userId, array $data): int
    {
        return $this->db->insert('outdoorbuddy_posts', [
            'caption' => trim($data['caption'] ?? ''),
            'banner' => '',
            'user_id' => $userId,
            'place_id' => isset($data['place_id']) ? (int) $data['place_id'] : null,
            'event_id' => isset($data['event_id']) ? (string) $data['event_id'] : null,
            'activity_id' => isset($data['activity_id']) ? (int) $data['activity_id'] : null,
        ]);
    }

    /**
     * Get all posts.
     */
    public function getAll(string $userId, array $filters = [], int $page = 1): array
    {
        $LIMIT = 20;
        $offset = ($page - 1) * $LIMIT;

        $sql = "SELECT
                    (SELECT COUNT(*) FROM outdoorbuddy_post_comment WHERE post_id = p.post_id) AS total_comment,
                    (SELECT COUNT(*) FROM outdoorbuddy_post_like WHERE post_id = p.post_id) AS total_likes,
                    p.post_id, p.banner, NOW() AS timeNow, p.date_cr8 AS date,
                    p.caption, p.type, pl.user_id AS sliked,
                    u.nickname, u.avatar, u.user_id
                FROM outdoorbuddy_posts p
                LEFT JOIN outdoorbuddy_post_like pl ON p.post_id = pl.post_id AND pl.user_id = ?
                LEFT JOIN outdoorbuddy_users u ON u.user_id = p.user_id
                WHERE 1=1";

        $params = [$userId];

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

        $sql .= " ORDER BY p.last_update DESC LIMIT ?, ?";
        $params[] = $offset;
        $params[] = $LIMIT;

        return $this->db->fetchAll($sql, array_values($params));
    }

    /**
     * Get posts by user.
     */
    public function getMyPosts(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT p.*, (SELECT COUNT(*) FROM outdoorbuddy_post_comment WHERE post_id = p.post_id) AS total_comment,
                     (SELECT COUNT(*) FROM outdoorbuddy_post_like WHERE post_id = p.post_id) AS total_likes
              FROM outdoorbuddy_posts p 
              WHERE p.user_id = ? 
              ORDER BY p.last_update DESC",
            [$userId]
        );
    }

    /**
     * Like/unlike a post.
     */
    public function likePost(int $postId, string $userId): array
    {
        $existing = $this->db->fetchOne(
            "SELECT id FROM outdoorbuddy_post_like WHERE post_id = ? AND user_id = ?",
            [$postId, $userId]
        );

        if ($existing) {
            // Unlike (delete)
            $this->db->delete('outdoorbuddy_post_like', 'id = ?', [$existing['id']]);
        } else {
            // Like
            try {
                $this->db->insert('outdoorbuddy_post_like', [
                    'post_id' => $postId,
                    'user_id' => $userId,
                    'datetime' => date('Y-m-d H:i:s'),
                ]);
            } catch (\Exception $e) {
                throw new \RuntimeException('Failed to like post');
            }
        }

        return ['success' => true];
    }

    /**
     * Comment on a post.
     */
    public function comment(int $postId, string $userId, array $data): array
    {
        $comment = trim($data['comment'] ?? '');
        if (empty($comment)) {
            throw new \InvalidArgumentException('Comment cannot be empty');
        }

        try {
            $this->db->insert('outdoorbuddy_post_comment', [
                'post_id' => $postId,
                'user_id' => $userId,
                'comment' => $comment,
                'datetime' => date('Y-m-d H:i:s'),
            ]);
        } catch (\Exception $e) {
            throw new \RuntimeException('Failed to add comment: ' . $e->getMessage());
        }

        return ['success' => true];
    }

    /**
     * Get comments for a post.
     */
    public function getComments(int $postId): array
    {
        return $this->db->fetchAll(
            "SELECT c.*, u.nickname, u.avatar 
             FROM outdoorbuddy_post_comment c 
             JOIN outdoorbuddy_users u ON c.user_id = u.user_id 
             WHERE c.post_id = ? 
             ORDER BY c.datetime ASC",
            [$postId]
        );
    }

    /**
     * Delete post.
     */
    public function delete(int $postId, string $userId): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM outdoorbuddy_posts WHERE post_id = ?",
            [$postId]
        );

        if ($owner !== $userId) {
            throw new BusinessLogicException('You do not own this post');
        }

        $this->db->delete('outdoorbuddy_post_image', 'post_id = ?', [$postId]);
        $this->db->delete('outdoorbuddy_post_like', 'post_id = ?', [$postId]);
        $this->db->delete('outdoorbuddy_post_comment', 'post_id = ?', [$postId]);
        $this->db->delete('outdoorbuddy_posts', 'post_id = ?', [$postId]);

        return ['success' => true];
    }

    /**
     * Get post images.
     */
    public function getImages(int $postId): array
    {
        return array_map(fn($img) => $img['image_url'], $this->db->fetchAll(
            "SELECT image_url FROM outdoorbuddy_post_image WHERE post_id = ?",
            [$postId]
        ));
    }

    /**
     * Get banner from first image if no banner set.
     */
    public function getBanner(int $postId): ?string
    {
        $post = $this->db->fetchOne(
            "SELECT banner FROM outdoorbuddy_posts WHERE post_id = ?",
            [$postId]
        );

        if ($post && !empty($post['banner'])) {
            return $post['banner'];
        }

        // Get first image as banner
        $images = $this->getImages($postId);
        return $images[0] ?? null;
    }
}
