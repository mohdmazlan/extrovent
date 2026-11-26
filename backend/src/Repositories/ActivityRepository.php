<?php

namespace Extrovent\Repositories;

use Extrovent\Database\Database;

/**
 * Activity repository - handles all database operations for activities.
 */
class ActivityRepository
{
    public function __construct(private Database $db) {}

    public function create(array $data): int
    {
        return $this->db->insert('outdoorbuddy_activity', [
            'category_Activity' => $data['category_Activity'],
            'name' => $data['name'],
            'description' => $data['description'],
            'coordinate' => $data['coordinate'] ?? '',
            'user_id' => $data['user_id'],
        ]);
    }

    public function getAll(): array
    {
        return $this->db->fetchAll(
            "SELECT a.*, u.nickname FROM outdoorbuddy_activity a 
             LEFT JOIN outdoorbuddy_users u ON a.user_id = u.user_id 
             ORDER BY a.create_date DESC"
        );
    }

    public function getById(int $activityId): ?array
    {
        return $this->db->fetchOne(
            "SELECT a.*, u.nickname FROM outdoorbuddy_activity a 
             LEFT JOIN outdoorbuddy_users u ON a.user_id = u.user_id 
             WHERE a.id = ?",
            [$activityId]
        );
    }

    public function deleteById(int $activityId): int
    {
        return $this->db->delete('outdoorbuddy_activity', 'id = ?', [$activityId]);
    }

    public function getOwner(int $activityId): ?string
    {
        $row = $this->db->fetchOne(
            "SELECT user_id FROM outdoorbuddy_activity WHERE id = ?",
            [$activityId]
        );
        return $row['user_id'] ?? null;
    }

    public function getImages(int $activityId): array
    {
        return array_map(fn($img) => $img['image_url'], $this->db->fetchAll(
            "SELECT image_url FROM outdoorbuddy_activity_image WHERE activity_id = ?",
            [$activityId]
        ));
    }

    public function deleteImages(int $activityId): int
    {
        return $this->db->delete('outdoorbuddy_activity_image', 'activity_id = ?', [$activityId]);
    }
}
