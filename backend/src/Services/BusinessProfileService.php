<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Exceptions\ValidationException;
use Extrovent\Exceptions\BusinessLogicException;

/**
 * BusinessProfile service - handles business profile business logic.
 */
class BusinessProfileService
{
    public function __construct(private Database $db) {}

    /**
     * Register a new business profile.
     */
    public function create(string $userId, array $data): int
    {
        // Validate required fields
        $missing = [];
        foreach (['company_name', 'reg_no', 'description'] as $field) {
            if (empty($data[$field])) {
                $missing[] = $field;
            }
        }

        if ($missing) {
            throw new ValidationException("Missing required fields: " . implode(', ', $missing));
        }

        return $this->db->insert('outdoorbuddy_business_profile', [
            'avatar' => $data['avatar'] ?? '',
            'company_name' => trim($data['company_name']),
            'reg_no' => trim($data['reg_no']),
            'description' => trim($data['description']),
            'user_id' => $userId,
        ]);
    }

    /**
     * Get all approved business profiles.
     */
    public function getAll(): array
    {
        return $this->db->fetchAll(
            "SELECT * FROM outdoorbuddy_business_profile WHERE approved = 1 ORDER BY create_date DESC"
        );
    }

    /**
     * Get business profile by ID.
     */
    public function getById(int $profileId): ?array
    {
        return $this->db->fetchOne(
            "SELECT * FROM outdoorbuddy_business_profile WHERE id = ?",
            [$profileId]
        );
    }

    /**
     * Update business profile.
     */
    public function update(int $profileId, string $userId, array $data): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM outdoorbuddy_business_profile WHERE id = ?",
            [$profileId]
        );

        if ($owner !== $userId) {
            throw new BusinessLogicException('You do not own this business profile');
        }

        $allowed = ['company_name', 'reg_no', 'description'];
        $updateData = [];

        foreach ($allowed as $field) {
            if (isset($data[$field]) && $data[$field] !== '') {
                $updateData[$field] = trim($data[$field]);
            }
        }

        if (empty($updateData)) {
            throw new ValidationException('No valid fields to update');
        }

        $affected = $this->db->update('outdoorbuddy_business_profile', $updateData, 'id = ?', [$profileId]);

        if (!$affected) {
            throw new \RuntimeException('Update failed');
        }

        return ['success' => true];
    }

    /**
     * Get business profiles created by user.
     */
    public function getMyProfiles(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT * FROM outdoorbuddy_business_profile WHERE user_id = ? ORDER BY create_date DESC",
            [$userId]
        );
    }

    /**
     * Update banner image.
     */
    public function updateBanner(int $profileId, string $userId, array $data): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM outdoorbuddy_business_profile WHERE id = ?",
            [$profileId]
        );

        if ($owner !== $userId) {
            throw new BusinessLogicException('You do not own this business profile');
        }

        $bannerUrl = $data['banner'] ?? '';
        $this->db->update('outdoorbuddy_business_profile', ['banner' => $bannerUrl], 'id = ?', [$profileId]);

        return ['success' => true, 'banner' => $bannerUrl];
    }

    /**
     * Update profile picture.
     */
    public function updateProfilePic(int $profileId, string $userId, array $data): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM outdoorbuddy_business_profile WHERE id = ?",
            [$profileId]
        );

        if ($owner !== $userId) {
            throw new BusinessLogicException('You do not own this business profile');
        }

        $avatarUrl = $data['avatar'] ?? '';
        $this->db->update('outdoorbuddy_business_profile', ['avatar' => $avatarUrl], 'id = ?', [$profileId]);

        return ['success' => true, 'avatar' => $avatarUrl];
    }
}
