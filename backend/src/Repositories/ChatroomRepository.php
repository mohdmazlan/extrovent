<?php

namespace Extrovent\Repositories;

use Extrovent\Database\Database;

/**
 * Chatroom repository - handles all database operations for chatrooms.
 */
class ChatroomRepository
{
    public function __construct(private Database $db) {}

    public function createRoom(array $data): int
    {
        return $this->db->insert('chatroom', [
            'name' => $data['name'] ?? '',
            'room_type' => $data['room_type'] ?? 1,
        ]);
    }

    public function addMember(int $roomId, string $userId, bool $isAdmin = false): int
    {
        return $this->db->insert('chatroom_members', [
            'user_id' => $userId,
            'room_id' => $roomId,
            'admin' => $isAdmin ? 1 : 0,
        ]);
    }

    public function findExistingRoom(string $userId1, string $userId2): ?int
    {
        // Use INTERSECT to find rooms shared by both users
        $sql = "SELECT room_id FROM (
                    SELECT room_id FROM chatroom_members WHERE user_id = ?
                    INTERSECT
                    SELECT room_id FROM chatroom_members WHERE user_id = ?
                ) AS shared_rooms";

        $row = $this->db->fetchOne($sql, [$userId1, $userId2]);
        return $row['room_id'] ?? null;
    }

    public function sendMessage(array $data): int
    {
        return $this->db->insert('chat_message', [
            'user_id' => $data['user_id'],
            'room_id' => $data['room_id'],
            'message' => $data['message'],
        ]);
    }

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

    public function sendGroupMessage(string $userId, string $message): int
    {
        return $this->db->insert('chat_message', [
            'user_id' => $userId,
            'room_id' => 0, // Group room
            'message' => $message,
        ]);
    }
}
