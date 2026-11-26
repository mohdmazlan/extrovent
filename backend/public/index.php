<?php

/**
 * Extrovent Backend API - Single Entry Point (Layered Architecture)
 * 
 * Flow: RequestParser → AuthMiddleware → Container → Service Method → ResponseFormatter
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Extrovent\Config\AppConfig;
use Extrovent\Database\Database as DbConnection;
use Extrovent\Services\Container;
use Extrovent\Middleware\RequestParser;
use Extrovent\Middleware\AuthMiddleware;
use Extrovent\Middleware\RateLimitMiddleware;
use Extrovent\Middleware\ResponseFormatter;
use Extrovent\Services\JWTService;
use Extrovent\Services\UserSessionService;
use Extrovent\Exceptions\ExtroventException;

// Load environment
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Set debug flag for error responses
define('APP_DEBUG', (($_ENV['APP_DEBUG'] ?? 'false') === 'true'));

/**
 * CORS: allow the web frontend cross-origin access.
 * Set CORS_ALLOWED_ORIGINS=* to allow any origin (dev), or comma-separated list for prod.
 * Preflight (OPTIONS) requests are answered here with 204 and exit.
 */
$corsOrigins = array_filter(array_map('trim', explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? '*')));
$isWildcard = in_array('*', $corsOrigins, true);
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($isWildcard) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Max-Age: 86400');
} elseif ($requestOrigin !== '' && in_array($requestOrigin, $corsOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Max-Age: 86400');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * Bootstrap: Create DI container with DB connection.
 */
function bootstrapContainer(): Container
{
    $config = new AppConfig(__DIR__ . '/..');
    
    $db = new DbConnection(
        $config->dbHost(),
        $config->dbPort(),
        $config->dbName(),
        $config->dbUser(),
        $config->dbPass()
    );

    Container::init($db);
    return Container::getInstance();
}

/**
 * Dispatch a request to the appropriate service method.
 */
function dispatch(string $method, string $path, RequestParser $request, ResponseFormatter $response, Container $container): void
{
    // Health check (no auth required)
    if ($path === 'health') {
        $response->success(['status' => 'ok', 'timestamp' => date('c')]);
        $response->send();
        return;
    }

    // Media serving (static files) - handled by serveMedia which calls exit
    if (str_starts_with($path, 'media/')) {
        serveMedia(substr($path, 6), $response);
        return;
    }

    // File upload serving - handled by serveUpload which calls exit
    if (str_starts_with($path, 'uploads/')) {
        serveUpload(substr($path, 8), $response);
        return;
    }

    // Route table: [path => ['service_class', 'method', 'requires_auth']]
    $routes = [
        // Auth routes
        'auth/signup'     => ['Extrovent\Services\UserService', 'signup', false],
        'auth/login'      => ['Extrovent\Services\AuthService', 'login', false],
        'auth/check-organizer' => ['Extrovent\Services\AuthService', 'checkOrganizerStatus', true],
        'auth/refresh'    => ['Extrovent\Services\AuthService', 'refreshToken', false],
        'auth/logout'     => ['Extrovent\Services\AuthService', 'logout', true],

        // User routes
        'user/profile'               => ['Extrovent\Services\UserService', 'getProfile', true],
        'user/update'                => ['Extrovent\Services\UserService', 'updateProfile', true],
        'user/update-profile-pic'    => ['Extrovent\Services\UserService', 'updateAvatar', true],
        'user/search'                => ['Extrovent\Services\UserService', 'searchUsers', true],
        'user/get-all'               => ['Extrovent\Services\UserService', 'getAllUsers', true],
        'user/contact'               => ['Extrovent\Services\UserService', 'getContacts', true],

        // Event routes
        'event/create'       => ['Extrovent\Services\EventService', 'create', true],
        'event/list'         => ['Extrovent\Services\EventService', 'getAll', true],
        'event/get'          => ['Extrovent\Services\EventService', 'getById', true],
        'event/update'       => ['Extrovent\Services\EventService', 'update', true],
        'event/delete'       => ['Extrovent\Services\EventService', 'delete', true],
        'event/my'           => ['Extrovent\Services\EventService', 'getMyEvents', true],
        'event/join'         => ['Extrovent\Services\EventService', 'joinEvent', true],
        'event/participants' => ['Extrovent\Services\EventService', 'getTotalParticipants', true],
        'event/like'         => ['Extrovent\Services\EventService', 'likeEvent', true],
        'event/liked'        => ['Extrovent\Services\EventService', 'getLikedEvents', true],

        // Place routes
        'place/create'       => ['Extrovent\Services\PlaceService', 'create', true],
        'place/list'         => ['Extrovent\Services\PlaceService', 'getAll', true],
        'place/get'          => ['Extrovent\Services\PlaceService', 'getById', true],
        'place/update'       => ['Extrovent\Services\PlaceService', 'update', true],
        'place/delete'       => ['Extrovent\Services\PlaceService', 'delete', true],
        'place/my'           => ['Extrovent\Services\PlaceService', 'getMyPlaces', true],

        // Activity routes
        'activity/create'    => ['Extrovent\Services\ActivityService', 'create', true],
        'activity/list'      => ['Extrovent\Services\ActivityService', 'getAll', true],
        'activity/get'       => ['Extrovent\Services\ActivityService', 'getById', true],
        'activity/delete'    => ['Extrovent\Services\ActivityService', 'delete', true],

        // Post routes
        'post/create'        => ['Extrovent\Services\PostService', 'create', true],
        'post/list'          => ['Extrovent\Services\PostService', 'getAll', true],
        'post/like'          => ['Extrovent\Services\PostService', 'likePost', true],
        'post/comment'       => ['Extrovent\Services\PostService', 'comment', true],
        'post/comments'      => ['Extrovent\Services\PostService', 'getComments', true],
        'post/my'            => ['Extrovent\Services\PostService', 'getMyPosts', true],
        'post/delete'        => ['Extrovent\Services\PostService', 'delete', true],

        // Business routes
        'business/register'      => ['Extrovent\Services\BusinessProfileService', 'create', true],
        'business/list'          => ['Extrovent\Services\BusinessProfileService', 'getAll', true],
        'business/get'           => ['Extrovent\Services\BusinessProfileService', 'getById', true],
        'business/update'        => ['Extrovent\Services\BusinessProfileService', 'update', true],
        'business/my'            => ['Extrovent\Services\BusinessProfileService', 'getMyProfiles', true],

        // Chatroom routes
        'chatroom/create'       => ['Extrovent\Services\ChatroomService', 'create', true],
        'chatroom/message'      => ['Extrovent\Services\ChatroomService', 'sendMessage', true],
        'chatroom/list'         => ['Extrovent\Services\ChatroomService', 'getRooms', true],
        'chatroom/messages'     => ['Extrovent\Services\ChatroomService', 'getMessages', true],
        'chatroom/group-message'=> ['Extrovent\Services\ChatroomService', 'sendGroupMessage', true],

        // Friend routes
        'friend/request'   => ['Extrovent\Services\FriendService', 'sendRequest', true],
        'friend/requests'  => ['Extrovent\Services\FriendService', 'getPendingRequests', true],
        'friend/accept'    => ['Extrovent\Services\FriendService', 'acceptRequest', true],
        'friend/list'      => ['Extrovent\Services\FriendService', 'getFriends', true],
        'friend/check'     => ['Extrovent\Services\FriendService', 'areFriends', true],

        // Search route
        'search'           => ['Extrovent\Services\SearchService', 'search', false],
    ];

    if (!isset($routes[$path])) {
        $response->error('Endpoint not found', 404);
        return;
    }

    [$serviceClass, $methodName, $requiresAuth] = $routes[$path];

    // Rate limiting for login endpoint (progressive, FB/IG-style)
    $isLoginRoute = ($path === 'auth/login');
    $rateLimiter = null;
    $loginIp = '';
    $loginUserId = null;
    if ($isLoginRoute) {
        $rateLimiter = new RateLimitMiddleware($container->db());
        $loginIp = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $loginUserId = trim((string) ($request->get('user_id') ?? ''));
        if ($loginUserId === '') {
            $loginUserId = null;
        }
        $rateCheck = $rateLimiter->checkRateLimit($loginIp, $loginUserId);
        if (!$rateCheck['allowed']) {
            $retryAfter = $rateCheck['retry_after'] ?? 60;
            $response->error(
                "Too many incorrect attempts. Please wait {$retryAfter} seconds and try again.",
                429,
                ['retry_after_seconds' => $retryAfter]
            );
            $response->send();
            return;
        }
    }

    // Handle special auth endpoints that need JWT service directly
    if ($path === 'auth/refresh') {
        handleRefreshEndpoint($request, $response, $container);
        return;
    }
    
    if ($path === 'auth/logout') {
        handleLogoutEndpoint($request, $response, $container);
        return;
    }

    // Authenticate if required
    $userId = null;
    if ($requiresAuth) {
        try {
            $jwtService = new JWTService($container->db());
            $sessionService = new UserSessionService($container->db());
            $authMiddleware = new AuthMiddleware($container->db(), $jwtService, $sessionService);
            $userId = $authMiddleware->authenticate($request->all());
        } catch (ExtroventException $e) {
            $response->handleError($e);
            $response->send();
            return;
        }
    }

    // Resolve service from container
    try {
        $service = $container->resolve($serviceClass);
    } catch (\InvalidArgumentException $e) {
        $response->error('Service not found: ' . $e->getMessage(), 500);
        return;
    }

    // Build method arguments
    $args = buildMethodArgs($serviceClass, $methodName, $request, $userId);

    // Call service method and capture return value
    try {
        $result = call_user_func_array([$service, $methodName], $args);

        // Reset rate limit on successful login
        if ($isLoginRoute && $rateLimiter !== null) {
            $rateLimiter->resetRateLimit($loginIp, $loginUserId);
        }
        
        // Set response based on result
        if ($result !== null) {
            $response->success($result);
        } else {
            $response->success();
        }
        
        // Send response
        $response->send();
    } catch (ExtroventException $e) {
        // Record failed login attempt, then warn if close to cooldown
        if ($isLoginRoute && $rateLimiter !== null) {
            $rateLimiter->recordFailedAttempt($loginIp, $loginUserId);
            $remaining = $rateLimiter->getRemainingAttempts($loginIp, $loginUserId);
            if ($rateLimiter->shouldWarn($remaining)) {
                $word = $remaining === 1 ? 'attempt' : 'attempts';
                $response->error(
                    $e->getMessage() . " You have {$remaining} {$word} left before a short cooldown.",
                    $e->getHttpStatusCode()
                );
                $response->send();
                return;
            }
        }
        $response->handleError($e);
        $response->send();
        return;
    } catch (\Throwable $e) {
        $response->handleError($e);
        $response->send();
        return;
    }
}

/**
 * Build method arguments based on service method signature.
 */
function buildMethodArgs(string $serviceClass, string $methodName, RequestParser $request, ?string $userId): array
{
    try {
        $reflection = new ReflectionMethod($serviceClass, $methodName);
    } catch (\ReflectionException $e) {
        return [];
    }

    $args = [];
    foreach ($reflection->getParameters() as $param) {
        $name = $param->getName();
        
        // Inject userId for authenticated routes
        if (in_array($name, ['userId', 'user_id']) && $userId !== null) {
            $args[] = $userId;
        }
        // Inject request data as 'data' parameter
        elseif ($name === 'data') {
            $args[] = $request->all();
        }
        // Inject specific IDs from request
        elseif (in_array($name, ['eventId', 'event_id']) || stripos($name, 'event') !== false) {
            $val = $request->get('event_id');
            if ($val !== null) $args[] = (int) $val;
        }
        elseif (in_array($name, ['placeId', 'place_id']) || stripos($name, 'place') !== false && stripos($name, 'profile') === false) {
            $val = $request->get('place_id');
            if ($val !== null) $args[] = (int) $val;
        }
        elseif (in_array($name, ['activityId', 'activity_id'])) {
            $val = $request->get('activity_id');
            if ($val !== null) $args[] = (int) $val;
        }
        elseif (in_array($name, ['postId', 'post_id']) || stripos($name, 'post') !== false && stripos($name, 'comment') === false) {
            $val = $request->get('post_id');
            if ($val !== null) $args[] = (int) $val;
        }
        elseif (in_array($name, ['roomId', 'room_id'])) {
            $val = $request->get('room_id');
            if ($val !== null) $args[] = (int) $val;
        }
        // Handle common search/query parameters
        elseif (in_array($name, ['query', 'search', 'q'])) {
            $val = $request->get('search') ?? $request->get('q') ?? $request->get('query');
            if ($val !== null) $args[] = $val;
        }
        // Handle category parameter for places/activities/etc
        elseif (in_array($name, ['category', 'place_id'])) {
            $val = $request->get('category') ?? $request->get('place_id');
            if ($val !== null) $args[] = $val;
        }
        // Default: try to get from request input by parameter name.
        // Positional alignment matters: when the value is missing but the
        // parameter has a default, pass the default explicitly instead of
        // skipping — otherwise every later argument shifts left and lands
        // in the wrong parameter (e.g. getAll($filters=[], $page=1) with
        // only ?page=1 would put "1" into $filters).
        else {
            $val = $request->get($name);
            if ($val !== null) {
                $args[] = $val;
            } elseif ($param->isDefaultValueAvailable()) {
                $args[] = $param->getDefaultValue();
            } elseif (!$param->isOptional()) {
                // Required param not found - skip (will cause error when calling)
            }
        }
    }

    return $args;
}

/**
 * Serve media files.
 */
function serveMedia(string $path, ResponseFormatter $response): void
{
    $basePath = __DIR__ . '/../uploads';
    $filePath = $basePath . '/' . ltrim($path, '/');

    if (!file_exists($filePath)) {
        $response->error('File not found', 404);
        return;
    }

    // Determine MIME type and send
    $mime = mime_content_type($filePath) ?: 'application/octet-stream';
    header("Content-Type: {$mime}");
    readfile($filePath);
    exit;
}

/**
 * Serve uploaded files.
 */
function serveUpload(string $path, ResponseFormatter $response): void
{
    $basePath = __DIR__ . '/../uploads';
    $filePath = $basePath . '/' . ltrim($path, '/');

    if (!file_exists($filePath)) {
        $response->error('File not found', 404);
        return;
    }

    // Determine MIME type and send
    $mime = mime_content_type($filePath) ?: 'application/octet-stream';
    header("Content-Type: {$mime}");
    readfile($filePath);
    exit;
}

/**
 * Handle /auth/refresh endpoint - refreshes access token using refresh token.
 */
function handleRefreshEndpoint(RequestParser $request, ResponseFormatter $response, Container $container): void
{
    try {
        $data = $request->all();
        $refreshToken = $data['refresh_token'] ?? '';
        
        if (empty($refreshToken)) {
            $response->error('Missing refresh_token', 400);
            $response->send();
            return;
        }

        $jwtService = new JWTService($container->db());
        $sessionService = new UserSessionService($container->db());
        
        // Validate refresh token
        try {
            $decoded = $jwtService->validateToken($refreshToken, 'refresh');
        } catch (\InvalidArgumentException $e) {
            $response->error('Invalid or expired refresh token', 401);
            $response->send();
            return;
        }

        // Reject revoked refresh tokens (rotation enforcement)
        if (isset($decoded->jti) && $jwtService->isTokenBlacklisted((string) $decoded->jti)) {
            $response->error('Refresh token has been revoked', 401);
            $response->send();
            return;
        }
        
        $userId = (string) ($decoded->sub ?? '');
        
        // Check user is still active
        $userExists = $container->db()->fetchOne(
            "SELECT user_id FROM users WHERE user_id = ?",
            [$userId]
        );
        
        if (!$userExists) {
            $response->error('User not found', 401);
            $response->send();
            return;
        }
        
        // Generate new tokens
        $roles = ['user'];
        $hasProfile = $container->db()->fetchOne(
            "SELECT id FROM business_profile WHERE user_id = ?",
            [$userId]
        );
        if ($hasProfile) {
            $roles[] = 'organizer';
        }
        
        $accessData = $jwtService->generateAccessToken($userId, ['roles' => $roles]);
        $refreshData = $jwtService->generateRefreshToken($userId);
        
        // Revoke old refresh token (simple rotation)
        if (isset($decoded->jti)) {
            $jwtService->blacklistToken(
                (string) $decoded->jti,
                $userId,
                (int) ($decoded->exp ?? time() + 86400)
            );
        }
        
        // Update session if available
        $sessionId = $data['session_id'] ?? '';
        if ($sessionId) {
            try {
                $sessionService->updateActivity($sessionId);
            } catch (\Throwable $e) {
                // Fail silently
            }
        }
        
        $response->success([
            'access_token' => $accessData['access_token'],
            'refresh_token' => $refreshData['refresh_token'],
            'token_type' => 'Bearer',
            'expires_in' => $accessData['expires_in'],
        ]);
        $response->send();
        
    } catch (\Throwable $e) {
        $response->error('Token refresh failed: ' . $e->getMessage(), 500);
        $response->send();
    }
}

/**
 * Handle /auth/logout endpoint - blacklists token and revokes session.
 */
function handleLogoutEndpoint(RequestParser $request, ResponseFormatter $response, Container $container): void
{
    try {
        // Extract Bearer token from Authorization header
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        
        if (!preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
            $response->error('Missing authorization token', 401);
            $response->send();
            return;
        }
        
        $token = $matches[1];
        $jwtService = new JWTService($container->db());
        $sessionService = new UserSessionService($container->db());
        
        // Decode and validate access token
        try {
            $decoded = $jwtService->validateToken($token, 'access');
        } catch (\InvalidArgumentException $e) {
            $response->error('Invalid or expired token', 401);
            $response->send();
            return;
        }
        
        $userId = (string) ($decoded->sub ?? '');
        
        // Blacklist the access token
        if (isset($decoded->jti)) {
            $jwtService->blacklistToken(
                (string) $decoded->jti,
                $userId,
                (int) ($decoded->exp ?? time() + 86400)
            );
        }
        
        // Revoke session if available
        $sessionId = $request->get('session_id') ?? '';
        if ($sessionId) {
            try {
                $sessionService->revokeSession($sessionId);
            } catch (\Throwable $e) {
                // Fail silently - session tracking is optional
            }
        }
        
        $response->success(['message' => 'Successfully logged out']);
        $response->send();
        
    } catch (\Throwable $e) {
        $response->error('Logout failed: ' . $e->getMessage(), 500);
        $response->send();
    }
}

// Swagger UI handler (before API routing)
if ($_SERVER['REQUEST_URI'] === '/swagger' || $_SERVER['REQUEST_URI'] === '/swagger/' || $_SERVER['REQUEST_URI'] === '/swagger/openapi.yaml') {
    include __DIR__ . '/swagger.php';
    exit;
}

// Bootstrap container
$container = bootstrapContainer();

// Parse request
$request = new RequestParser();
$response = new ResponseFormatter();

// Strip /api/ prefix if present (e.g., /api/auth/signup → auth/signup)
$path = $request->path();
if (str_starts_with($path, 'api/')) {
    $path = substr($path, 4);
}

// Dispatch to appropriate service (with stripped /api/ prefix)
dispatch(
    $request->method(),
    $path,
    $request,
    $response,
    $container
);
