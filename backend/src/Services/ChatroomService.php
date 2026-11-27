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

    private function genId(): string
    {
        $b = random_bytes(16);
        $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
        $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
        $h = bin2hex($b);
        return sprintf('%s-%s-%s-%s-%s', substr($h,0,8), substr($h,8,4), substr($h,12,4), substr($h,16,4), substr($h,20,12));
    }

    /**
     * Create a new chatroom between two users.
     */
    public function create(string $userId, array $data): string
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
                return $existing['room_id'];
            }

            // Create new room
            $now = date('Y-m-d H:i:s');
            $roomId = $this->genId();
            $this->db->insert('chatroom', [
                'room_id' => $roomId,
                'name' => $roomName ?? '',
                'room_type' => 1,
                'datetime' => $now,
            ]);

            // Add members
            $member1 = [
                'user_id' => $userId,
                'room_id' => $roomId,
                'datetime' => $now,
                'admin' => 1,
            ];
            $member2 = [
                'user_id' => $userId2,
                'room_id' => $roomId,
                'datetime' => $now,
                'admin' => 0,
            ];
            $this->db->insert('chatroom_members', $member1);
            $this->db->insert('chatroom_members', $member2);

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
        $roomId = (string) ($data['room_id'] ?? '');
        $message = trim($data['message'] ?? '');

        if ($roomId === '' || $message === '') {
            throw new ValidationException('Room ID and message are required');
        }

        $insert = [
            'user_id' => $userId,
            'room_id' => $roomId,
            'message' => $message,
            'datetime' => date('Y-m-d H:i:s'),
        ];
        return $this->db->insert('chat_message', $insert);
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
             INNER JOIN users u ON crm.user_id = u.id AND crm.user_id != ?
             WHERE crm.room_id IN (SELECT room_id FROM chatroom_members WHERE user_id = ?)
             GROUP BY x.room_id 
             ORDER BY x.lastDate DESC",
            [$userId, $userId]
        );
    }

    /**
     * Get messages for a room.
     */
    public function getMessages(string $roomId): array
    {
        return $this->db->fetchAll(
            "SELECT cm.user_id, u.nickname, u.avatar, cm.message, cm.datetime 
             FROM chat_message cm 
             JOIN users u ON cm.user_id = u.id 
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

        $insert = [
            'user_id' => $userId,
            'room_id' => 0, // Group room
            'message' => $message,
            'datetime' => date('Y-m-d H:i:s'),
        ];
        return $this->db->insert('chat_message', $insert);
    }
}
