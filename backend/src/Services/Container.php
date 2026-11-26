<?php

namespace Extrovent\Services;

use Extrovent\Database\Database;
use Extrovent\Repositories\UserRepository;
use Extrovent\Repositories\EventRepository;
use Extrovent\Repositories\PlaceRepository;
use Extrovent\Repositories\ActivityRepository;
use Extrovent\Repositories\PostRepository;
use Extrovent\Repositories\BusinessProfileRepository;
use Extrovent\Repositories\ChatroomRepository;
use Extrovent\Repositories\FriendRepository;
use Extrovent\Repositories\SearchRepository;

/**
 * Application service container - resolves all services and repositories.
 */
class Container
{
    private static ?self $instance = null;
    private array $services = [];
    private array $repositories = [];

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

        // Resolve repositories
        $repoMap = [
            UserRepository::class => 'user',
            EventRepository::class => 'event',
            PlaceRepository::class => 'place',
            ActivityRepository::class => 'activity',
            PostRepository::class => 'post',
            BusinessProfileRepository::class => 'business',
            ChatroomRepository::class => 'chatroom',
            FriendRepository::class => 'friend',
            SearchRepository::class => 'search',
        ];

        if (isset($repoMap[$type])) {
            $key = $repoMap[$type];
            if (!isset($this->repositories[$key])) {
                $this->repositories[$key] = new $type($this->db);
            }
            return $this->repositories[$key];
        }

        throw new \InvalidArgumentException("Unknown service/repository type: {$type}");
    }

    public function db(): Database
    {
        return $this->db;
    }
}
