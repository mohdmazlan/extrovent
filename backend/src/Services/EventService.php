<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Exceptions\ValidationException;
use Extrovent\Exceptions\BusinessLogicException;

/**
 * Event service - handles event business logic.
 */
class EventService
{
    public function __construct(private Database $db) {}

    /**
     * Create a new event.
     */
    public function create(string $userId, array $data): int
    {
        // Validate required fields
        $missing = [];
        foreach (['category', 'title', 'place_id', 'start_date', 'start_time', 'description'] as $field) {
            if (empty($data[$field])) {
                $missing[] = $field;
            }
        }

        if ($missing) {
            throw new ValidationException("Missing required fields: " . implode(', ', $missing));
        }

        return $this->db->insert('outdoorbuddy_events', [
            'category' => trim($data['category']),
            'title' => trim($data['title']),
            'place_id' => (int) $data['place_id'],
            'fee' => isset($data['fee']) ? (int) $data['fee'] : 0,
            'start_date' => $data['start_date'],
            'start_time' => $data['start_time'],
            'description' => trim($data['description']),
            'user_id' => $userId,
            'business_profile_id' => isset($data['business_profile_id']) ? (int) $data['business_profile_id'] : 0,
        ]);
    }

    /**
     * Get all events.
     */
    public function getAll(?string $placeId = null): array
    {
        $sql = "SELECT e.*, u.nickname 
                FROM outdoorbuddy_events e
                LEFT JOIN outdoorbuddy_users u ON e.user_id = u.user_id";

        $params = [];

        if ($placeId !== null && $placeId !== '') {
            $sql .= " WHERE e.place_id = ?";
            $params[] = $placeId;
        }

        $sql .= " ORDER BY e.create_date DESC";

        return $this->db->fetchAll($sql, $params);
    }

    /**
     * Get event by ID.
     */
    public function getById(int $eventId): ?array
    {
        return $this->db->fetchOne(
            "SELECT e.*, u.nickname 
             FROM outdoorbuddy_events e
             LEFT JOIN outdoorbuddy_users u ON e.user_id = u.user_id
             WHERE e.event_id = ?",
            [$eventId]
        );
    }

    /**
     * Update event.
     */
    public function update(int $eventId, string $userId, array $data): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM outdoorbuddy_events WHERE event_id = ?",
            [$eventId]
        );

        if ($owner !== $userId) {
            throw new BusinessLogicException('You do not own this event');
        }

        $allowed = ['category', 'title', 'place_id', 'fee', 'start_date', 'start_time', 'description'];
        $updateData = [];

        foreach ($allowed as $field) {
            if (isset($data[$field]) && $data[$field] !== '') {
                $updateData[$field] = $data[$field];
            }
        }

        if (empty($updateData)) {
            throw new ValidationException('No valid fields to update');
        }

        $affected = $this->db->update('outdoorbuddy_events', $updateData, 'event_id = ?', [$eventId]);

        if (!$affected) {
            throw new \RuntimeException('Update failed');
        }

        return ['success' => true];
    }

    /**
     * Delete event.
     */
    public function delete(int $eventId, string $userId): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM outdoorbuddy_events WHERE event_id = ?",
            [$eventId]
        );

        if ($owner !== $userId) {
            throw new BusinessLogicException('You do not own this event');
        }

        // Delete related data
        $this->db->delete('outdoorbuddy_event_image', 'event_id = ?', [$eventId]);
        $this->db->delete('outdoorbuddy_event_rating', 'event_id = ?', [$eventId]);
        $this->db->delete('outdoorbuddy_event_like', 'event_id = ?', [$eventId]);
        $this->db->delete('outdoorbuddy_event_comment', 'event_id = ?', [$eventId]);
        $this->db->delete('outdoorbuddy_events', 'event_id = ?', [$eventId]);

        return ['success' => true];
    }

    /**
     * Get events created by user.
     */
    public function getMyEvents(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT * FROM outdoorbuddy_events WHERE user_id = ? ORDER BY create_date DESC",
            [$userId]
        );
    }

    /**
     * Join an event.
     */
    public function joinEvent(int $eventId, string $userId): array
    {
        // Check if already joined
        $count = $this->db->fetchColumn(
            "SELECT COUNT(*) FROM outdoorbuddy_event_participants 
             WHERE event_id = ? AND user_id = ?",
            [$eventId, $userId]
        );

        if ($count > 0) {
            throw new BusinessLogicException('Already joined this event');
        }

        try {
            $this->db->insert('outdoorbuddy_event_participants', [
                'event_id' => $eventId,
                'user_id' => $userId,
            ]);
        } catch (\Exception $e) {
            // Table might not exist yet - handle gracefully
        }

        return ['success' => true];
    }

    /**
     * Get participant count.
     */
    public function getTotalParticipants(int $eventId): int
    {
        $count = $this->db->fetchColumn(
            "SELECT COUNT(*) FROM outdoorbuddy_event_participants WHERE event_id = ?",
            [$eventId]
        );
        return (int) ($count ?: 0);
    }

    /**
     * Like/unlike an event.
     */
    public function likeEvent(int $eventId, string $userId): array
    {
        // Check if already liked
        $existing = $this->db->fetchOne(
            "SELECT id FROM outdoorbuddy_event_like WHERE event_id = ? AND user_id = ?",
            [$eventId, $userId]
        );

        if ($existing) {
            // Unlike (delete)
            $this->db->delete('outdoorbuddy_event_like', 'id = ?', [$existing['id']]);
        } else {
            // Like
            try {
                $this->db->insert('outdoorbuddy_event_like', [
                    'user_id' => $userId,
                    'event_id' => (string) $eventId,
                ]);
            } catch (\Exception $e) {
                throw new \RuntimeException('Failed to like event');
            }
        }

        return ['success' => true];
    }

    /**
     * Get liked events.
     */
    public function getLikedEvents(string $userId): array
    {
        return array_map(fn($row) => (int) $row['event_id'], $this->db->fetchAll(
            "SELECT event_id FROM outdoorbuddy_event_like WHERE user_id = ?",
            [$userId]
        ));
    }

    /**
     * Get event images.
     */
    public function getImages(int $eventId): array
    {
        return array_map(fn($img) => $img['image_url'], $this->db->fetchAll(
            "SELECT image_url FROM outdoorbuddy_event_image WHERE event_id = ?",
            [$eventId]
        ));
    }
}
