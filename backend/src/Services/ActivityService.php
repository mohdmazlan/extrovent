<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Exceptions\ValidationException;
use Extrovent\Exceptions\BusinessLogicException;

/**
 * Activity service - handles activity business logic.
 */
class ActivityService
{
    public function __construct(private Database $db) {}

    /**
     * Create a new activity.
     */
    public function create(string $userId, array $data): int
    {
        // Validate required fields
        $missing = [];
        foreach (['category_Activity', 'name', 'description'] as $field) {
            if (empty($data[$field])) {
                $missing[] = $field;
            }
        }

        if ($missing) {
            throw new ValidationException("Missing required fields: " . implode(', ', $missing));
        }

        return $this->db->insert('activity', [
            'category_Activity' => trim($data['category_Activity']),
            'name' => trim($data['name']),
            'description' => trim($data['description']),
            'coordinate' => $data['coordinate'] ?? '',
            'user_id' => $userId,
        ]);
    }

    /**
     * Get all activities.
     */
    public function getAll(): array
    {
        return $this->db->fetchAll(
            "SELECT a.*, u.nickname FROM activity a 
             LEFT JOIN users u ON a.user_id = u.user_id 
             ORDER BY a.create_date DESC"
        );
    }

    /**
     * Get activity by ID.
     */
    public function getById(int $activityId): ?array
    {
        return $this->db->fetchOne(
            "SELECT a.*, u.nickname FROM activity a 
             LEFT JOIN users u ON a.user_id = u.user_id 
             WHERE a.id = ?",
            [$activityId]
        );
    }

    /**
     * Delete activity.
     */
    public function delete(int $activityId, string $userId): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM activity WHERE id = ?",
            [$activityId]
        );

        if ($owner !== $userId) {
            throw new BusinessLogicException('You do not own this activity');
        }

        $this->db->delete('activity_image', 'activity_id = ?', [$activityId]);
        $this->db->delete('activity_rating', 'activity_id = ?', [$activityId]);
        $this->db->delete('activity', 'id = ?', [$activityId]);

        return ['success' => true];
    }

    /**
     * Get activity images.
     */
    public function getImages(int $activityId): array
    {
        return array_map(fn($img) => $img['image_url'], $this->db->fetchAll(
            "SELECT image_url FROM activity_image WHERE activity_id = ?",
            [$activityId]
        ));
    }
}
