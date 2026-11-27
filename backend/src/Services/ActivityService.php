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

    private function genId(): string
    {
        $b = random_bytes(16);
        $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
        $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
        $h = bin2hex($b);
        return sprintf('%s-%s-%s-%s-%s', substr($h,0,8), substr($h,8,4), substr($h,12,4), substr($h,16,4), substr($h,20,12));
    }

    private function parseCoordinate(mixed $raw): ?array
    {
        if ($raw === null || $raw === '') return null;
        if (!is_string($raw) || !preg_match('/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/', $raw, $m)) {
            throw new ValidationException('Invalid coordinate format, expected "lat,lng"');
        }
        $lat = (float) $m[1]; $lng = (float) $m[2];
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            throw new ValidationException('Coordinate out of range');
        }
        return [$lat, $lng];
    }

    /**
     * Create a new activity.
     */
    public function create(string $userId, array $data): string
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

        $coords = $this->parseCoordinate($data['coordinate'] ?? null);
        $now = date('Y-m-d H:i:s');
        if ($coords === null) {
            // Coordinate is NOT NULL (POINT) — default to 0,0 if not provided so insert doesn't 1364/1366
            $coords = [0.0, 0.0];
        }
        $id = $this->genId();
        $stmt = $this->db->query(
            "INSERT INTO activity (id, category_Activity, name, description, coordinate, create_date, last_update, user_id)
             VALUES (?, ?, ?, ?, ST_GeomFromText(CONCAT('POINT(', ?, ' ', ?, ')')), ?, ?, ?)",
            [$id, trim($data['category_Activity']), trim($data['name']), trim($data['description']), $coords[0], $coords[1], $now, $now, $userId]
        );
        return $id;
    }

    /**
     * Get all activities.
     */
    public function getAll(): array
    {
        return $this->db->fetchAll(
            "SELECT a.*, u.nickname FROM activity a 
             LEFT JOIN users u ON a.user_id = u.id 
             ORDER BY a.create_date DESC"
        );
    }

    /**
     * Get activity by ID.
     */
    public function getById(string $activityId): array
    {
        $row = $this->db->fetchOne(
            "SELECT a.*, u.nickname FROM activity a 
             LEFT JOIN users u ON a.user_id = u.id 
             WHERE a.id = ?",
            [$activityId]
        );
        if (!$row) {
            throw new \Extrovent\Exceptions\NotFoundException('Activity not found');
        }
        return $row;
    }

    /**
     * Delete activity.
     */
    public function delete(string $activityId, string $userId): array
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
    public function getImages(string $activityId): array
    {
        return array_map(fn($img) => $img['image_url'], $this->db->fetchAll(
            "SELECT image_url FROM activity_image WHERE activity_id = ?",
            [$activityId]
        ));
    }
}
