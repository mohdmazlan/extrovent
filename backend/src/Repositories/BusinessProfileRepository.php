<?php

namespace Extrovent\Repositories;

use Extrovent\Database\Database;

/**
 * BusinessProfile repository - handles all database operations for business profiles.
 */
class BusinessProfileRepository
{
    public function __construct(private Database $db) {}

    public function create(array $data): int
    {
        return $this->db->insert('business_profile', [
            'avatar' => $data['avatar'] ?? '',
            'company_name' => $data['company_name'],
            'reg_no' => $data['reg_no'],
            'description' => $data['description'],
            'user_id' => $data['user_id'],
        ]);
    }

    public function getAllApproved(): array
    {
        return $this->db->fetchAll(
            "SELECT * FROM business_profile WHERE approved = 1 ORDER BY create_date DESC"
        );
    }

    public function getById(int $profileId): ?array
    {
        return $this->db->fetchOne(
            "SELECT * FROM business_profile WHERE id = ?",
            [$profileId]
        );
    }

    public function update(int $profileId, array $data): int
    {
        return $this->db->update('business_profile', $data, 'id = ?', [$profileId]);
    }

    public function getByUserId(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT * FROM business_profile WHERE user_id = ? ORDER BY create_date DESC",
            [$userId]
        );
    }

    public function getOwner(int $profileId): ?string
    {
        $row = $this->db->fetchOne(
            "SELECT user_id FROM business_profile WHERE id = ?",
            [$profileId]
        );
        return $row['user_id'] ?? null;
    }
}
