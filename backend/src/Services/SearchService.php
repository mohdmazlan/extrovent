<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Exceptions\ValidationException;

/**
 * Search service - handles unified search across all entities.
 */
class SearchService
{
    public function __construct(private Database $db) {}

    /**
     * Unified search across places, events, activities, and users.
     */
    public function search(array $data): array
    {
        $query = trim($data['query'] ?? '');

        if (empty($query)) {
            throw new ValidationException('Search query cannot be empty');
        }

        $search = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $query) . '%';
        $results = [
            'places' => [],
            'events' => [],
            'activities' => [],
            'users' => [],
        ];

        // Search places
        $results['places'] = array_map(function ($place) {
            $place['images'] = array_map(
                fn($img) => $img['image_url'],
                $this->db->fetchAll("SELECT image_url FROM outdoorbuddy_place_image WHERE place_id = ?", [$place['id']])
            );
            return $place;
        }, $this->db->fetchAll(
            "SELECT p.id, p.name AS title, p.description, p.user_id, bp.company_name, 
                    p.category_location AS category, 'place' AS type
             FROM outdoorbuddy_place p
             LEFT JOIN outdoorbuddy_business_profile bp ON p.business_profile_id = bp.id
             WHERE p.name LIKE ? OR p.description LIKE ?",
            [$search, $search]
        ));

        // Search events
        $results['events'] = array_map(function ($event) {
            $event['images'] = array_map(
                fn($img) => $img['image_url'],
                $this->db->fetchAll("SELECT image_url FROM outdoorbuddy_event_image WHERE event_id = ?", [$event['id']])
            );

            $rating = $this->db->fetchOne(
                "SELECT AVG(rating) as avg_rating, COUNT(id) as count_rating 
                 FROM outdoorbuddy_event_rating WHERE event_id = ?",
                [$event['id']]
            );
            $event['avg_rating'] = $rating ? floatval($rating['avg_rating']) : 0.0;
            $event['count_rating'] = $rating ? intval($rating['count_rating']) : 0;

            return $event;
        }, $this->db->fetchAll(
            "SELECT e.event_id AS id, e.title, e.description, e.user_id, bp.company_name, 
                    e.category, 'event' AS type
             FROM outdoorbuddy_events e
             LEFT JOIN outdoorbuddy_business_profile bp ON e.business_profile_id = bp.id
             WHERE e.title LIKE ? OR e.description LIKE ?",
            [$search, $search]
        ));

        // Search activities
        $results['activities'] = array_map(function ($activity) {
            $activity['images'] = array_map(
                fn($img) => $img['image_url'],
                $this->db->fetchAll("SELECT image_url FROM outdoorbuddy_activity_image WHERE activity_id = ?", [$activity['id']])
            );
            return $activity;
        }, $this->db->fetchAll(
            "SELECT a.id, a.name AS title, a.description, a.user_id, 
                    a.category_Activity AS category, 'activity' AS type
             FROM outdoorbuddy_activity a
             WHERE a.name LIKE ? OR a.description LIKE ?",
            [$search, $search]
        ));

        // Search users
        $results['users'] = $this->db->fetchAll(
            "SELECT user_id, nickname, avatar, 'user' AS type 
             FROM outdoorbuddy_users 
             WHERE nickname LIKE ? OR email LIKE ? 
             LIMIT 10",
            [$search, $search]
        );

        return $results;
    }
}
