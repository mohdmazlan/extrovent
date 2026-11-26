<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Exceptions\ValidationException;
use Extrovent\Exceptions\BusinessLogicException;

/**
 * Place service - handles place business logic.
 */
class PlaceService
{
    public function __construct(private Database $db) {}

    /**
     * Create a new place.
     */
    public function create(string $userId, array $data): int
    {
        // Validate required fields
        $missing = [];
        foreach (['name', 'description', 'category_location'] as $field) {
            if (empty($data[$field])) {
                $missing[] = $field;
            }
        }

        if ($missing) {
            throw new ValidationException("Missing required fields: " . implode(', ', $missing));
        }

        return $this->db->insert('outdoorbuddy_place', [
            'name' => trim($data['name']),
            'description' => trim($data['description'] ?? ''),
            'category_location' => trim($data['category_location'] ?? 'others'),
            'coordinate' => $data['coordinate'] ?? '',
            'business_profile_id' => isset($data['business_profile_id']) ? (int) $data['business_profile_id'] : 0,
            'user_id' => $userId,
        ]);
    }

    /**
     * Get all places.
     */
    public function getAll(?string $category = null): array
    {
        $sql = "SELECT p.*, bp.company_name 
                FROM outdoorbuddy_place p
                LEFT JOIN outdoorbuddy_business_profile bp ON p.business_profile_id = bp.id";

        $params = [];

        if ($category !== null && $category !== '') {
            $sql .= " WHERE p.category_location = ?";
            $params[] = $category;
        }

        $sql .= " ORDER BY p.create_date DESC";

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Get place by ID.
     */
    public function getById(int $placeId): ?array
    {
        return $this->db->fetchOne(
            "SELECT p.*, bp.company_name 
             FROM outdoorbuddy_place p
             LEFT JOIN outdoorbuddy_business_profile bp ON p.business_profile_id = bp.id
             WHERE p.id = ?",
            [$placeId]
        );
    }

    /**
     * Update place.
     */
    public function update(int $placeId, string $userId, array $data): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM outdoorbuddy_place WHERE id = ?",
            [$placeId]
        );

        if ($owner !== $userId) {
            throw new BusinessLogicException('You do not own this place');
        }

        $allowed = ['name', 'description', 'category_location', 'coordinate'];
        $updateData = [];

        foreach ($allowed as $field) {
            if (isset($data[$field]) && $data[$field] !== '') {
                $updateData[$field] = $data[$field];
            }
        }

        if (empty($updateData)) {
            throw new ValidationException('No valid fields to update');
        }

        $affected = $this->db->update('outdoorbuddy_place', $updateData, 'id = ?', [$placeId]);

        if (!$affected) {
            throw new \RuntimeException('Update failed');
        }

        return ['success' => true];
    }

    /**
     * Delete place.
     */
    public function delete(int $placeId, string $userId): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM outdoorbuddy_place WHERE id = ?",
            [$placeId]
        );

        if ($owner !== $userId) {
            throw new BusinessLogicException('You do not own this place');
        }

        $this->db->delete('outdoorbuddy_place_image', 'place_id = ?', [$placeId]);
        $this->db->delete('outdoorbuddy_place_rating', 'place_id = ?', [$placeId]);
        $this->db->delete('outdoorbuddy_place', 'id = ?', [$placeId]);

        return ['success' => true];
    }

    /**
     * Get places created by user.
     */
    public function getMyPlaces(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT * FROM outdoorbuddy_place WHERE user_id = ? ORDER BY create_date DESC",
            [$userId]
        );
    }

    /**
     * Get place images.
     */
    public function getImages(int $placeId): array
    {
        return array_map(fn($img) => $img['image_url'], $this->db->fetchAll(
            "SELECT image_url FROM outdoorbuddy_place_image WHERE place_id = ?",
            [$placeId]
        ));
    }
}
