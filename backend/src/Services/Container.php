<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;

/**
 * Application service container - resolves all services.
 */
class Container
{
    private static ?self $instance = null;
    private array $services = [];

    public function __construct(private Database $db) {}

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            throw new \RuntimeException('Container not initialized. Call init() first.');
        }
        return self::$instance;
    }

    public static function init(Database $db): void
    {
        if (self::$instance === null) {
            self::$instance = new self($db);
        }
    }

    public function resolve(string $type): mixed
    {
        // Resolve services
        $serviceMap = [
            AuthService::class => 'auth',
            UserService::class => 'user',
            EventService::class => 'event',
            PlaceService::class => 'place',
            ActivityService::class => 'activity',
            PostService::class => 'post',
            BusinessProfileService::class => 'business',
            ChatroomService::class => 'chatroom',
            FriendService::class => 'friend',
            SearchService::class => 'search',
        ];

        if (isset($serviceMap[$type])) {
            $key = $serviceMap[$type];
            if (!isset($this->services[$key])) {
                // Resolve AuthService with optional JWT and session dependencies
                if ($type === AuthService::class) {
                    $jwtService = new JWTService($this->db);
                    $sessionService = new UserSessionService($this->db);
                    $this->services[$key] = new AuthService($this->db, $jwtService, $sessionService);
                } else {
                    $this->services[$key] = new $type($this->db);
                }
            }
            return $this->services[$key];
        }

        throw new \InvalidArgumentException("Unknown service type: {$type}");
    }

    public function db(): Database
    {
        return $this->db;
    }
}
