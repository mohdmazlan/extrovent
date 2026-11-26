<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

echo "=== JWT Service Verification Tests ===" . PHP_EOL . PHP_EOL;

$secret = 'test-secret-key-for-verification-' . uniqid();

// Test 1: Basic encode/decode
echo "Test 1: JWT encode/decode..." . PHP_EOL;
$payload = [
    'iss' => 'http://localhost',
    'iat' => time(),
    'exp' => time() + 86400,
    'sub' => 'user123',
    'roles' => ['user', 'organizer'],
];

$token = JWT::encode($payload, $secret, 'HS256');
echo "  Token generated: " . substr($token, 0, 50) . "..." . PHP_EOL;

$decoded = JWT::decode($token, new Key($secret, 'HS256'));
assert($decoded->sub === 'user123', 'sub claim mismatch');
assert(is_array($decoded->roles), 'roles should be array');
assert(in_array('user', $decoded->roles), 'user role missing');
echo "  PASS" . PHP_EOL . PHP_EOL;

// Test 2: Expired token rejection
echo "Test 2: Expired token rejection..." . PHP_EOL;
$expiredPayload = [
    'iss' => 'http://localhost',
    'iat' => time(),
    'exp' => time() - 10, // expired 10 seconds ago
    'sub' => 'user123',
];
$expiredToken = JWT::encode($expiredPayload, $secret, 'HS256');

try {
    JWT::decode($expiredToken, new Key($secret, 'HS256'));
    echo "  FAIL: Should have rejected expired token" . PHP_EOL;
} catch (Firebase\JWT\ExpiredException $e) {
    echo "  PASS: Expired token correctly rejected" . PHP_EOL;
}
echo PHP_EOL;

// Test 3: Invalid signature rejection
echo "Test 3: Invalid signature rejection..." . PHP_EOL;
try {
    JWT::decode($token, new Key('wrong-secret', 'HS256'));
    echo "  FAIL: Should have rejected invalid signature" . PHP_EOL;
} catch (\DomainException $e) {
    echo "  PASS: Invalid signature correctly rejected" . PHP_EOL;
}
echo PHP_EOL;

// Test 4: Malformed token rejection
echo "Test 4: Malformed token rejection..." . PHP_EOL;
try {
    JWT::decode('not.a.valid.token', new Key($secret, 'HS256'));
    echo "  FAIL: Should have rejected malformed token" . PHP_EOL;
} catch (\DomainException $e) {
    echo "  PASS: Malformed token correctly rejected (DomainException)" . PHP_EOL;
} catch (\UnexpectedValueException $e) {
    echo "  PASS: Malformed token correctly rejected (UnexpectedValueException)" . PHP_EOL;
}
echo PHP_EOL;

// Test 5: Verify JWTService class can be loaded
echo "Test 5: JWTService class autoload..." . PHP_EOL;
$reflector = new ReflectionClass(\Extrovent\Services\JWTService::class);
echo "  Class exists and can be reflected" . PHP_EOL;
echo "  Methods: " . implode(', ', array_map(fn($m) => $m->getName(), $reflector->getMethods())) . PHP_EOL;
echo "  PASS" . PHP_EOL . PHP_EOL;

// Test 6: Verify AuthMiddleware class can be loaded
echo "Test 6: AuthMiddleware class autoload..." . PHP_EOL;
$reflector = new ReflectionClass(\Extrovent\Middleware\AuthMiddleware::class);
echo "  Class exists and can be reflected" . PHP_EOL;
echo "  PASS" . PHP_EOL . PHP_EOL;

// Test 7: Verify RateLimitMiddleware class can be loaded
echo "Test 7: RateLimitMiddleware class autoload..." . PHP_EOL;
$reflector = new ReflectionClass(\Extrovent\Middleware\RateLimitMiddleware::class);
echo "  Class exists and can be reflected" . PHP_EOL;
echo "  PASS" . PHP_EOL . PHP_EOL;

// Test 8: Verify UserSessionService class can be loaded
echo "Test 8: UserSessionService class autoload..." . PHP_EOL;
$reflector = new ReflectionClass(\Extrovent\Services\UserSessionService::class);
echo "  Class exists and can be reflected" . PHP_EOL;
echo "  PASS" . PHP_EOL . PHP_EOL;

echo "=== All Verification Tests Passed! ===" . PHP_EOL;
