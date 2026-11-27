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

    private function genId(): string
    {
        $b = random_bytes(16);
        $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
        $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
        $h = bin2hex($b);
        return sprintf('%s-%s-%s-%s-%s', substr($h,0,8), substr($h,8,4), substr($h,12,4), substr($h,16,4), substr($h,20,12));
    }

    /**
     * Parse an opaque "lat,lng" coordinate string into [lat, lng].
     * Returns null when absent; throws on malformed input.
     *
     * @return array{float,float}|null
     */
    private function parseCoordinate(mixed $raw): ?array
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        if (!is_string($raw) || !preg_match('/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/', $raw, $m)) {
            throw new ValidationException('Invalid coordinate format, expected "lat,lng"');
        }
        $lat = (float) $m[1];
        $lng = (float) $m[2];
        if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
            throw new ValidationException('Coordinate out of range');
        }
        return [$lat, $lng];
    }

    /**
     * Create a new place.
     */
    public function create(string $userId, array $data): string
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

        $coords = $this->parseCoordinate($data['coordinate'] ?? null);
        if ($coords === null) {
            throw new ValidationException("Missing required fields: coordinate (click the map to set a location)");
        }

        $id = $this->genId();
        $stmt = $this->db->query(
            "INSERT INTO place
                (id, name, description, category_location, coordinate, create_date, last_update, verified, user_id, business_profile_id)
             VALUES (?, ?, ?, ?, ST_GeomFromText(CONCAT('POINT(', ?, ' ', ?, ')')), NOW(), NOW(), 1, ?, ?)",
            [
                $id,
                trim($data['name']),
                trim($data['description'] ?? ''),
                trim($data['category_location'] ?? 'others'),
                $coords[0],
                $coords[1],
                $userId,
                !empty($data['business_profile_id']) ? trim((string) $data['business_profile_id']) : null,
            ]
        );

        return $id;
    }

    /**
     * Get all places.
     */
    public function getAll(?string $category = null): array
    {
        $sql = "SELECT p.id, p.category_location, p.name, p.description,
                       CONCAT(ST_X(p.coordinate), ',', ST_Y(p.coordinate)) AS coordinate,
                       p.create_date, p.last_update, p.verified, p.user_id, p.business_profile_id,
                       bp.company_name 
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

    /**
     * Get place by ID.
     */
    public function getById(string $placeId): array
    {
        $row = $this->db->fetchOne(
            "SELECT p.id, p.category_location, p.name, p.description,
                    CONCAT(ST_X(p.coordinate), ',', ST_Y(p.coordinate)) AS coordinate,
                    p.create_date, p.last_update, p.verified, p.user_id, p.business_profile_id,
                    bp.company_name
             FROM place p
             LEFT JOIN business_profile bp ON p.business_profile_id = bp.id
             WHERE p.id = ?",
            [$placeId]
        );
        if (!$row) {
            throw new \Extrovent\Exceptions\NotFoundException('Place not found');
        }
        return $row;
    }

    /**
     * Update place.
     */
    public function update(string $placeId, string $userId, array $data): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM place WHERE id = ?",
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

        // POINT columns can't be bound as plain values: translate separately.
        if (isset($updateData['coordinate'])) {
            $coords = $this->parseCoordinate($updateData['coordinate']);
            if ($coords === null) {
                throw new ValidationException('Invalid coordinate format, expected "lat,lng"');
            }
            $this->db->query(
                "UPDATE place SET coordinate = ST_GeomFromText(CONCAT('POINT(', ?, ' ', ?, ')')) WHERE id = ?",
                [$coords[0], $coords[1], $placeId]
            );
            unset($updateData['coordinate']);
        }

        if (empty($updateData)) {
            throw new ValidationException('No valid fields to update');
        }

        $affected = $this->db->update('place', $updateData, 'id = ?', [$placeId]);

        if (!$affected) {
            throw new \RuntimeException('Update failed');
        }

        return ['success' => true];
    }

    /**
     * Delete place.
     */
    public function delete(string $placeId, string $userId): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM place WHERE id = ?",
            [$placeId]
        );
        if ($owner !== $userId) {
            throw new BusinessLogicException('You do not own this place');
        }

        $this->db->delete('place_image', 'place_id = ?', [$placeId]);
        $this->db->delete('place_rating', 'place_id = ?', [$placeId]);
        $this->db->delete('place', 'id = ?', [$placeId]);

        return ['success' => true];
    }

    /**
     * Get places created by user.
     */
    public function getMyPlaces(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT id, category_location, name, description,
                    CONCAT(ST_X(coordinate), ',', ST_Y(coordinate)) AS coordinate,
                    create_date, last_update, verified, user_id, business_profile_id
             FROM place WHERE user_id = ? ORDER BY create_date DESC",
            [$userId]
        );
    }

    /**
     * Get place images.
     */
    public function getImages(string $placeId): array
    {
        return array_map(fn($img) => $img['image_url'], $this->db->fetchAll(
            "SELECT image_url FROM place_image WHERE place_id = ?",
            [$placeId]
        ));
    }
}
