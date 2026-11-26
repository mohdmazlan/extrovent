<?php

namespace Extrovent\Repositories;

use Extrovent\Database\Database;

/**
 * Search repository - handles unified search across all entities.
 */
class SearchRepository
{
    public function __construct(private Database $db) {}

    public function searchPlaces(string $query): array
    {
        $search = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $query) . '%';
        $places = $this->db->fetchAll(
            "SELECT p.id, p.name AS title, p.description, p.user_id, bp.company_name, 
                    p.category_location AS category, 'place' AS type
             FROM place p
             LEFT JOIN business_profile bp ON p.business_profile_id = bp.id
             WHERE p.name LIKE ? OR p.description LIKE ?",
            [$search, $search]
        );

        foreach ($places as &$place) {
            $place['images'] = array_map(
                fn($img) => $img['image_url'],
                $this->db->fetchAll("SELECT image_url FROM place_image WHERE place_id = ?", [$place['id']])
            );
        }

        return $places;
    }

    public function searchEvents(string $query): array
    {
        $search = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $query) . '%';
        $events = $this->db->fetchAll(
            "SELECT e.event_id AS id, e.title, e.description, e.user_id, bp.company_name, 
                    e.category, 'event' AS type
             FROM events e
             LEFT JOIN business_profile bp ON e.business_profile_id = bp.id
             WHERE e.title LIKE ? OR e.description LIKE ?",
            [$search, $search]
        );

        foreach ($events as &$event) {
            $event['images'] = array_map(
                fn($img) => $img['image_url'],
                $this->db->fetchAll("SELECT image_url FROM event_image WHERE event_id = ?", [$event['id']])
            );

            $rating = $this->db->fetchOne(
                "SELECT AVG(rating) as avg_rating, COUNT(id) as count_rating 
                 FROM event_rating WHERE event_id = ?",
                [$event['id']]
            );
            $event['avg_rating'] = $rating ? floatval($rating['avg_rating']) : 0.0;
            $event['count_rating'] = $rating ? intval($rating['count_rating']) : 0;
        }

        return $events;
    }

    public function searchActivities(string $query): array
    {
        $search = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $query) . '%';
        $activities = $this->db->fetchAll(
            "SELECT a.id, a.name AS title, a.description, a.user_id, 
                    a.category_Activity AS category, 'activity' AS type
             FROM activity a
             WHERE a.name LIKE ? OR a.description LIKE ?",
            [$search, $search]
        );

        foreach ($activities as &$activity) {
            $activity['images'] = array_map(
                fn($img) => $img['image_url'],
                $this->db->fetchAll("SELECT image_url FROM activity_image WHERE activity_id = ?", [$activity['id']])
            );
        }

        return $activities;
    }

    public function searchUsers(string $query): array
    {
        $search = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $query) . '%';
        return $this->db->fetchAll(
            "SELECT user_id, nickname, avatar, 'user' AS type 
             FROM users 
             WHERE nickname LIKE ? OR email LIKE ? 
             LIMIT 10",
            [$search, $search]
        );
    }
}
