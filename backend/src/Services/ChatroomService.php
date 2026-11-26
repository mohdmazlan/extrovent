<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Exceptions\ValidationException;
use Extrovent\Exceptions\BusinessLogicException;

/**
 * Chatroom service - handles chatroom business logic.
 */
class ChatroomService
{
    public function __construct(private Database $db) {}

    /**
     * Create a new chatroom between two users.
     */
    public function create(string $userId, array $data): int
    {
        $userId2 = $data['user_id_2'] ?? '';
        $roomName = $data['name'] ?? '';

        if (empty($userId2)) {
            throw new ValidationException('Second user ID is required');
        }

        try {
            // Check if room already exists
            $existing = $this->db->fetchOne(
                "SELECT room_id FROM (
                    SELECT room_id FROM chatroom_members WHERE user_id = ?
                    INTERSECT
                    SELECT room_id FROM chatroom_members WHERE user_id = ?
                ) AS shared_rooms",
                [$userId, $userId2]
            );

            if ($existing) {
                return (int) $existing['room_id'];
            }

            // Create new room
            $roomId = $this->db->insert('chatroom', [
                'name' => $roomName ?? '',
                'room_type' => 1,
            ]);

            // Add members
            $this->db->insert('chatroom_members', [
                'user_id' => $userId,
                'room_id' => $roomId,
                'admin' => 1,
            ]);

            $this->db->insert('chatroom_members', [
                'user_id' => $userId2,
                'room_id' => $roomId,
                'admin' => 0,
            ]);

            return $roomId;
        } catch (\Exception $e) {
            throw new \RuntimeException('Failed to create chatroom: ' . $e->getMessage());
        }
    }

    /**
     * Send a message.
     */
    public function sendMessage(string $userId, array $data): int
    {
        $roomId = (int) ($data['room_id'] ?? 0);
        $message = trim($data['message'] ?? '');

        if (empty($roomId) || empty($message)) {
            throw new ValidationException('Room ID and message are required');
        }

        return $this->db->insert('chat_message', [
            'user_id' => $userId,
            'room_id' => $roomId,
            'message' => $message,
        ]);
    }

    /**
     * Get user's chatrooms.
     */
    public function getRooms(string $userId): array
    {
        return $this->db->fetchAll(
            "SELECT cm.room_id, cm.user_id AS sender, cm.message, cm.datetime, 
                    u.nickname, u.avatar
             FROM (
                 SELECT room_id, MAX(datetime) as lastDate
                 FROM chat_message 
                 GROUP BY room_id
             ) AS x
             INNER JOIN chat_message cm ON cm.room_id = x.room_id AND cm.datetime = x.lastDate
             INNER JOIN chatroom_members crm ON crm.room_id = x.room_id
             INNER JOIN outdoorbuddy_users u ON crm.user_id = u.user_id AND crm.user_id != ?
             WHERE crm.user_id IN (SELECT room_id FROM chatroom_members WHERE user_id = ?)
             GROUP BY x.room_id 
             ORDER BY x.lastDate DESC",
            [$userId, $userId]
        );
    }

    /**
     * Get messages for a room.
     */
    public function getMessages(int $roomId): array
    {
        return $this->db->fetchAll(
            "SELECT cm.user_id, u.nickname, u.avatar, cm.message, cm.datetime 
             FROM chat_message cm 
             JOIN outdoorbuddy_users u ON cm.user_id = u.user_id 
             WHERE cm.room_id = ? 
             ORDER BY cm.datetime ASC",
            [$roomId]
        );
    }

    /**
     * Send a group message.
     */
    public function sendGroupMessage(string $userId, array $data): int
    {
        $message = trim($data['message'] ?? '');

        if (empty($message)) {
            throw new ValidationException('Message is required');
        }

        return $this->db->insert('chat_message', [
            'user_id' => $userId,
            'room_id' => 0, // Group room
            'message' => $message,
        ]);
    }
}
