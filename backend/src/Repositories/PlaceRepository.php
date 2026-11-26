<?php

namespace Extrovent\Repositories;

use Extrovent\Database\Database;

/**
 * Place repository - handles all database operations for places.
 */
class PlaceRepository
{
    public function __construct(private Database $db) {}

    public function create(array $data): int
    {
        return $this->db->insert('place', [
            'name' => $data['name'],
            'description' => $data['description'] ?? '',
            'category_location' => $data['category_location'] ?? 'others',
            'coordinate' => $data['coordinate'] ?? '',
            'business_profile_id' => $data['business_profile_id'] ?? 0,
            'user_id' => $data['user_id'],
        ]);
    }

    public function getAll(?string $category = null): array
    {
        $sql = "SELECT p.*, bp.company_name 
                FROM place p
                LEFT JOIN business_profile bp ON p.business_profile_id = bp.id";

        $params = [];

        if ($category !== null && $category !== '') {
            $sql .= " WHERE p.category_location = ?";
            $params[] = $category;
        }

        $sql .= " ORDER BY p.create_date DESC";

        return $this->db->fetchAll($sql, $params);
    }

    public function getById(int $placeId): ?array
    {
        return $this->db->fetchOne(
            "SELECT p.*, bp.company_name 
             FROM place p
             LEFT JOIN business_profile bp ON p.business_profile_id = bp.id
             WHERE p.id = ?",
            [$placeId]
        );
    }

    public function update(int $placeId, array $data): int
    {
        return $this->db->update('place', $data, 'id = ?', [$placeId]);
    }

    public function deleteById(int $placeId): int
    {
        return $this->db->delete('place', 'id = ?', [$placeId]);
    }

    public function getByUserId(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT * FROM place WHERE user_id = ? ORDER BY create_date DESC",
            [$userId]
        );
    }

    public function getOwner(int $placeId): ?string
    {
        $row = $this->db->fetchOne(
            "SELECT user_id FROM place WHERE id = ?",
            [$placeId]
        );
        return $row['user_id'] ?? null;
    }

    public function getImages(int $placeId): array
    {
        return array_map(fn($img) => $img['image_url'], $this->db->fetchAll(
            "SELECT image_url FROM place_image WHERE place_id = ?",
            [$placeId]
        ));
    }

    public function deleteImages(int $placeId): int
    {
        return $this->db->delete('place_image', 'place_id = ?', [$placeId]);
    }
}
