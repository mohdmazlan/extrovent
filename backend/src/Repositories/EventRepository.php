<?php

namespace Extrovent\Repositories;

use Extrovent\Database\Database;

/**
 * Event repository - handles all database operations for events.
 */
class EventRepository
{
    public function __construct(private Database $db) {}

    public function create(array $data): int
    {
        return $this->db->insert('events', [
            'category' => $data['category'],
            'title' => $data['title'],
            'place_id' => $data['place_id'],
            'fee' => $data['fee'] ?? 0,
            'start_date' => $data['start_date'],
            'start_time' => $data['start_time'],
            'description' => $data['description'],
            'user_id' => $data['user_id'],
            'business_profile_id' => $data['business_profile_id'] ?? 0,
        ]);
    }

    public function getAll(?string $placeId = null): array
    {
        $sql = "SELECT e.*, u.nickname 
                FROM events e
                LEFT JOIN users u ON e.user_id = u.user_id";

        $params = [];

        if ($placeId !== null && $placeId !== '') {
            $sql .= " WHERE e.place_id = ?";
            $params[] = $placeId;
        }

        $sql .= " ORDER BY e.create_date DESC";

        return $this->db->fetchAll($sql, $params);
    }

    public function getById(int $eventId): ?array
    {
        return $this->db->fetchOne(
            "SELECT e.*, u.nickname 
             FROM events e
             LEFT JOIN users u ON e.user_id = u.user_id
             WHERE e.event_id = ?",
            [$eventId]
        );
    }

    public function update(int $eventId, array $data): int
    {
        return $this->db->update('events', $data, 'event_id = ?', [$eventId]);
    }

    public function deleteById(int $eventId): int
    {
        return $this->db->delete('events', 'event_id = ?', [$eventId]);
    }

    public function getByUserId(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT * FROM events WHERE user_id = ? ORDER BY create_date DESC",
            [$userId]
        );
    }

    public function getOwner(int $eventId): ?string
    {
        $row = $this->db->fetchOne(
            "SELECT user_id FROM events WHERE event_id = ?",
            [$eventId]
        );
        return $row['user_id'] ?? null;
    }

    public function countParticipants(int $eventId): int
    {
        $count = $this->db->fetchColumn(
            "SELECT COUNT(*) FROM event_participants WHERE event_id = ?",
            [$eventId]
        );
        return (int) ($count ?: 0);
    }

    public function hasJoined(int $eventId, string $userId): bool
    {
        $count = $this->db->fetchColumn(
            "SELECT COUNT(*) FROM event_participants 
             WHERE event_id = ? AND user_id = ?",
            [$eventId, $userId]
        );
        return (bool) ($count > 0);
    }

    public function joinEvent(int $eventId, string $userId): void
    {
        $this->db->insert('event_participants', [
            'event_id' => $eventId,
            'user_id' => $userId,
        ]);
    }

    public function getImages(int $eventId): array
    {
        return array_map(fn($img) => $img['image_url'], $this->db->fetchAll(
            "SELECT image_url FROM event_image WHERE event_id = ?",
            [$eventId]
        ));
    }

    public function likeEvent(int $eventId, string $userId): void
    {
        $this->db->insert('event_like', [
            'user_id' => $userId,
            'event_id' => (string) $eventId,
        ]);
    }

    public function unlikeEvent(int $eventId, string $userId): void
    {
        $this->db->delete(
            'event_like',
            'event_id = ? AND user_id = ?',
            [$eventId, $userId]
        );
    }

    public function isLiked(int $eventId, string $userId): bool
    {
        $row = $this->db->fetchOne(
            "SELECT id FROM event_like WHERE event_id = ? AND user_id = ?",
            [$eventId, $userId]
        );
        return (bool) $row;
    }

    public function getLikedEvents(string $userId): array
    {
        return array_map(fn($row) => (int) $row['event_id'], $this->db->fetchAll(
            "SELECT event_id FROM event_like WHERE user_id = ?",
            [$userId]
        ));
    }

    public function deleteImages(int $eventId): int
    {
        return $this->db->delete('event_image', 'event_id = ?', [$eventId]);
    }

    public function deleteLikes(int $eventId): int
    {
        return $this->db->delete('event_like', 'event_id = ?', [$eventId]);
    }
}
