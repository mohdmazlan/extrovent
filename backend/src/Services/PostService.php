<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Exceptions\BusinessLogicException;
use Extrovent\Exceptions\ValidationException;

/**
 * Post service - handles post business logic.
 * 1-go schema: users.id CHAR(36) UUID PK, all user_id FKs CHAR(36).
 */
class PostService
{
    public function __construct(private Database $db) {}

    private const MAX_POST_IMAGES = 5;
    private const MAX_IMAGE_BYTES = 10485760;
    private const MAX_VIDEO_BYTES = 52428800;
    private const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    private const VIDEO_EXTS = ['mp4', 'mov', 'webm', '3gp', 'mkv', 'ogv', 'avi'];

    private function genId(): string
    {
        $b = random_bytes(16);
        $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
        $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
        $h = bin2hex($b);
        return sprintf('%s-%s-%s-%s-%s', substr($h,0,8), substr($h,8,4), substr($h,12,4), substr($h,16,4), substr($h,20,12));
    }

    /**
     * Create a new post.
     */
    public function create(string $userId, array $data, array $files = []): string
    {
        $now = date('Y-m-d H:i:s');
        $id = $this->genId();
        $media = $this->normalizeMediaFiles($files);
        $hasMedia = $media['images'] !== [] || $media['video'] !== null;
        $this->db->insert('posts', [
            'post_id' => $id,
            'caption' => trim((string) ($data['caption'] ?? '')),
            'banner' => '',
            'type' => $hasMedia ? '6' : '1',
            'user_id' => $userId,
            'place_id' => isset($data['place_id']) && $data['place_id'] !== '' ? trim((string) $data['place_id']) : null,
            'event_id' => isset($data['event_id']) && $data['event_id'] !== '' ? trim((string) $data['event_id']) : null,
            'activity_id' => isset($data['activity_id']) && $data['activity_id'] !== '' ? trim((string) $data['activity_id']) : null,
            'create_date' => $now,
            'last_update' => $now,
        ]);
        $stored = $this->storeMedia($id, $userId, $media);
        if ($stored['images'] !== []) {
            $this->db->update('posts', ['banner' => $stored['images'][0]], 'post_id = ?', [$id]);
        }
        return $id;
    }

    /**
     * Get all posts.
     */
    public function getAll(string $userId, array $filters = [], int $page = 1): array
    {
        $LIMIT = 20;
        $offset = ($page - 1) * $LIMIT;

        $sql = "SELECT
                    (SELECT COUNT(*) FROM post_comment WHERE post_id = p.post_id) AS total_comment,
                    (SELECT COUNT(*) FROM post_like WHERE post_id = p.post_id) AS total_likes,
                    p.post_id, p.banner, NOW() AS timeNow, p.create_date AS date,
                    p.caption, p.type, pl.user_id AS sliked,
                    u.id, u.username, u.nickname, u.avatar
                FROM posts p
                LEFT JOIN post_like pl ON p.post_id = pl.post_id AND pl.user_id = ?
                LEFT JOIN users u ON u.id = p.user_id
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

        $posts = $this->db->fetchAll($sql, array_values($params));
        return $this->withImages($posts);
    }

    /**
     * Get posts by user.
     */
    public function getMyPosts(string $userId): array
    {
        $posts = $this->db->fetchAll(
            "SELECT p.*, (SELECT COUNT(*) FROM post_comment WHERE post_id = p.post_id) AS total_comment,
                     (SELECT COUNT(*) FROM post_like WHERE post_id = p.post_id) AS total_likes
              FROM posts p
              WHERE p.user_id = ?
              ORDER BY p.last_update DESC",
            [$userId]
        );
        return $this->withImages($posts);
    }

    /**
     * Like/unlike a post.
     */
    public function likePost(string $postId, string $userId): array
    {
        $existing = $this->db->fetchOne(
            "SELECT id FROM post_like WHERE post_id = ? AND user_id = ?",
            [$postId, $userId]
        );

        if ($existing) {
            // Unlike (delete)
            $this->db->delete('post_like', 'id = ?', [$existing['id']]);
        } else {
            // Like
            try {
                $this->db->insert('post_like', [
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
    public function comment(string $postId, string $userId, array $data): array
    {
        $comment = trim($data['comment'] ?? '');
        if (empty($comment)) {
            throw new \InvalidArgumentException('Comment cannot be empty');
        }

        try {
            $this->db->insert('post_comment', [
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
    public function getComments(string $postId): array
    {
        return $this->db->fetchAll(
            "SELECT c.*, u.nickname, u.username, u.avatar
             FROM post_comment c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = ?
             ORDER BY c.datetime ASC",
            [$postId]
        );
    }

    /**
     * Delete post.
     */
    public function delete(string $postId, string $userId): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM posts WHERE post_id = ?",
            [$postId]
        );

        if ($owner !== $userId) {
            throw new BusinessLogicException('You do not own this post');
        }

        $this->db->delete('post_image', 'post_id = ?', [$postId]);
        $this->db->delete('post_like', 'post_id = ?', [$postId]);
        $this->db->delete('post_comment', 'post_id = ?', [$postId]);
        $this->db->delete('posts', 'post_id = ?', [$postId]);

        return ['success' => true];
    }

    /**
     * Get post images.
     */
    public function getImages(string $postId): array
    {
        return array_map(fn($img) => $img['image_url'], $this->db->fetchAll(
            "SELECT image_url FROM post_image WHERE post_id = ?",
            [$postId]
        ));
    }

    /**
     * Get banner from first image if no banner set.
     */
    public function getBanner(string $postId): ?string
    {
        $post = $this->db->fetchOne(
            "SELECT banner FROM posts WHERE post_id = ?",
            [$postId]
        );

        if ($post && !empty($post['banner'])) {
            return $post['banner'];
        }

        // Get first image as banner
        $images = $this->getImages($postId);
        return $images[0] ?? null;
    }

    /**
     * Attach image_url lists to post rows for feed rendering.
     */
    private function withImages(array $posts): array
    {
        foreach ($posts as &$p) {
            $pid = $p['post_id'] ?? null;
            $p['images'] = ($pid !== null && $pid !== '') ? $this->getImages((string) $pid) : [];
        }
        unset($p);
        return $posts;
    }

    /**
     * Normalize $_FILES input into an image list plus a single optional video.
     */
    private function normalizeMediaFiles(array $files): array
    {
        $images = [];
        if (isset($files['images']) && is_array($files['images'])) {
            $img = $files['images'];
            if (isset($img['name']) && is_array($img['name'])) {
                $count = count($img['name']);
                for ($i = 0; $i < $count; $i++) {
                    $images[] = [
                        'name' => $img['name'][$i] ?? '',
                        'type' => $img['type'][$i] ?? '',
                        'tmp_name' => $img['tmp_name'][$i] ?? '',
                        'error' => $img['error'][$i] ?? UPLOAD_ERR_NO_FILE,
                        'size' => $img['size'][$i] ?? 0,
                    ];
                }
            } elseif (isset($img['tmp_name'])) {
                $images[] = $img;
            }
        }
        $video = null;
        if (isset($files['video']) && is_array($files['video'])) {
            $verr = $files['video']['error'] ?? UPLOAD_ERR_NO_FILE;
            if ($verr !== UPLOAD_ERR_NO_FILE) {
                $video = $files['video'];
            }
        }
        return ['images' => $images, 'video' => $video];
    }

    /**
     * Validate, move and register uploaded media. Returns stored relative urls.
     */
    private function storeMedia(string $postId, string $userId, array $media): array
    {
        $images = $media['images'] ?? [];
        $video = $media['video'] ?? null;
        if (count($images) > self::MAX_POST_IMAGES) {
            throw new ValidationException('Max ' . self::MAX_POST_IMAGES . ' images allowed');
        }
        if ($images === [] && $video === null) {
            return ['images' => [], 'video' => null];
        }
        $dir = __DIR__ . '/../../storage/' . $userId . '/feed/' . $postId;
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new \RuntimeException('Failed to prepare upload directory');
        }
        $prefix = 'storage/' . $userId . '/feed/' . $postId;
        $urls = [];
        foreach ($images as $file) {
            $urls[] = $this->storeOne($dir, $prefix, $file, self::IMAGE_EXTS, self::MAX_IMAGE_BYTES, 'image');
        }
        $videoUrl = null;
        if ($video !== null) {
            $videoUrl = $this->storeOne($dir, $prefix, $video, self::VIDEO_EXTS, self::MAX_VIDEO_BYTES, 'video');
        }
        foreach ($videoUrl !== null ? array_merge($urls, [$videoUrl]) : $urls as $url) {
            $this->db->insert('post_image', ['post_id' => $postId, 'image_url' => $url]);
        }
        return ['images' => $urls, 'video' => $videoUrl];
    }

    /**
     * Validate and move a single uploaded file. Returns its relative url.
     */
    private function storeOne(string $dir, string $prefix, array $file, array $exts, int $maxBytes, string $kind): string
    {
        $err = $file['error'] ?? UPLOAD_ERR_NO_FILE;
        if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
            throw new ValidationException('File exceeds server upload limit');
        }
        if ($err !== UPLOAD_ERR_OK) {
            throw new ValidationException('File upload failed');
        }
        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > $maxBytes) {
            throw new ValidationException($kind === 'video' ? 'Video exceeds 50MB' : 'Each image must be 10MB or less');
        }
        $orig = (string) ($file['name'] ?? '');
        $ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
        if ($ext === '' || !in_array($ext, $exts, true)) {
            throw new ValidationException($kind === 'video' ? 'Unsupported video format' : 'Only JPG, PNG, WebP or GIF images allowed');
        }
        if (class_exists('finfo')) {
            $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
            $ok = $kind === 'video' ? str_starts_with((string) $mime, 'video/') : str_starts_with((string) $mime, 'image/');
            if (!$ok) {
                throw new ValidationException('File content does not match its type');
            }
        }
        $name = bin2hex(random_bytes(8)) . '.' . $ext;
        $dest = $dir . '/' . $name;
        if (!is_uploaded_file($file['tmp_name']) || !move_uploaded_file($file['tmp_name'], $dest)) {
            throw new \RuntimeException('Failed to save uploaded file');
        }
        return $prefix . '/' . $name;
    }
}
