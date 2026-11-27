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

    private function genId(): string
    {
        $b = random_bytes(16);
        $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
        $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
        $h = bin2hex($b);
        return sprintf('%s-%s-%s-%s-%s', substr($h,0,8), substr($h,8,4), substr($h,12,4), substr($h,16,4), substr($h,20,12));
    }

    /**
     * Create a new event.
     */
    public function create(string $userId, array $data): string
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

        $id = $this->genId();
        $insert = [
            'event_id' => $id,
            'category' => trim($data['category']),
            'title' => trim($data['title']),
            'place_id' => trim((string) $data['place_id']),
            'fee' => isset($data['fee']) ? (int) $data['fee'] : 0,
            'start_date' => $data['start_date'],
            'start_time' => $data['start_time'],
            'description' => trim($data['description']),
            'user_id' => $userId,
            'business_profile_id' => isset($data['business_profile_id']) && $data['business_profile_id'] !== '' ? trim((string) $data['business_profile_id']) : '',
            'create_date' => date('Y-m-d H:i:s'),
            'last_update' => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('events', $insert);
        return $id;
    }

    /**
     * Get all events.
     */
    public function getAll(?string $placeId = null): array
    {
        $sql = "SELECT e.*, u.nickname 
                FROM events e
                LEFT JOIN users u ON e.user_id = u.id";

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
    public function getById(string $eventId): array
    {
        $row = $this->db->fetchOne(
            "SELECT e.*, u.nickname 
             FROM events e
             LEFT JOIN users u ON e.user_id = u.id
             WHERE e.event_id = ?",
            [$eventId]
        );
        if (!$row) {
            throw new \Extrovent\Exceptions\NotFoundException('Event not found');
        }
        return $row;
    }

    /**
     * Update event.
     */
    public function update(string $eventId, string $userId, array $data): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM events WHERE event_id = ?",
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

        $affected = $this->db->update('events', $updateData, 'event_id = ?', [$eventId]);

        if (!$affected) {
            throw new \RuntimeException('Update failed');
        }

        return ['success' => true];
    }

    /**
     * Delete event.
     */
    public function delete(string $eventId, string $userId): array
    {
        // Verify ownership
        $owner = $this->db->fetchColumn(
            "SELECT user_id FROM events WHERE event_id = ?",
            [$eventId]
        );
        if ($owner !== $userId) {
            throw new BusinessLogicException('You do not own this event');
        }

        // Delete related data
        $this->db->delete('event_image', 'event_id = ?', [$eventId]);
        $this->db->delete('event_rating', 'event_id = ?', [$eventId]);
        $this->db->delete('event_like', 'event_id = ?', [$eventId]);
        $this->db->delete('event_comment', 'event_id = ?', [$eventId]);
        $this->db->delete('events', 'event_id = ?', [$eventId]);

        return ['success' => true];
    }

    /**
     * Get events created by user.
     */
    public function getMyEvents(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT * FROM events WHERE user_id = ? ORDER BY create_date DESC",
            [$userId]
        );
    }

    /**
     * Join an event.
     */
    public function joinEvent(string $eventId, string $userId): array
    {
        // Check if already joined
        $count = $this->db->fetchColumn(
            "SELECT COUNT(*) FROM participants 
             WHERE event_id = ? AND user_id = ?",
            [$eventId, $userId]
        );

        if ($count > 0) {
            throw new BusinessLogicException('Already joined this event');
        }

        $insert = [
            'event_id' => $eventId,
            'user_id' => $userId,
            'datetime' => date('Y-m-d H:i:s'),
        ];
        $this->db->insert('participants', $insert);

        return ['success' => true];
    }

    /**
     * Get participant count.
     */
    public function getTotalParticipants(string $eventId): int
    {
        $count = $this->db->fetchColumn(
            "SELECT COUNT(*) FROM participants WHERE event_id = ?",
            [$eventId]
        );
        return (int) ($count ?: 0);
    }

    /**
     * Like/unlike an event.
     */
    public function likeEvent(string $eventId, string $userId): array
    {
        // Check if already liked
        $existing = $this->db->fetchOne(
            "SELECT id FROM event_like WHERE event_id = ? AND user_id = ?",
            [$eventId, $userId]
        );

        if ($existing) {
            // Unlike (delete)
            $this->db->delete('event_like', 'id = ?', [$existing['id']]);
        } else {
            // Like
            try {
                $insert = [
                    'user_id' => $userId,
                    'event_id' => $eventId,
                    'datetime' => date('Y-m-d H:i:s'),
                ];
                $this->db->insert('event_like', $insert);
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
        return array_map(fn($row) => $row['event_id'], $this->db->fetchAll(
            "SELECT event_id FROM event_like WHERE user_id = ?",
            [$userId]
        ));
    }

    /**
     * Get event images.
     */
    public function getImages(string $eventId): array
    {
        return array_map(fn($img) => $img['image_url'], $this->db->fetchAll(
            "SELECT image_url FROM event_image WHERE event_id = ?",
            [$eventId]
        ));
    }
}
