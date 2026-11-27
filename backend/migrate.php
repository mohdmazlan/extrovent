<?php

/**
 * Extrovent Database Setup — single-file init.
 *
 *   php migrate.php            Create DB if needed + import database/schema.sql if empty
 *   php migrate.php --fresh    DROP DATABASE + recreate + import schema.sql (destructive — dev only)
 *   php migrate.php --dry-run  Show what would happen, change nothing
 *
 * database/schema.sql is the single source of truth (complete schema, no seed data).
 * Re-runs are safe: if the `users` table exists, nothing is imported.
 *
 * Env (.env): DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
 */

require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$args = $argv ?? [];
$dryRun = in_array('--dry-run', $args, true);
$fresh  = in_array('--fresh', $args, true);

$host   = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port   = $_ENV['DB_PORT'] ?? '3306';
$dbname = $_ENV['DB_NAME'] ?? 'extrovent';
$user   = $_ENV['DB_USER'] ?? 'root';
$pass   = $_ENV['DB_PASS'] ?? '';

$schemaFile = __DIR__ . '/database/schema.sql';

echo "========================================\n";
echo "  Extrovent Database Setup\n";
echo "========================================\n\n";
echo "DB: {$dbname}@{$host}:{$port}  user: {$user}\n";
echo "Schema: database/schema.sql\n";
if ($dryRun) {
    echo "Mode: DRY RUN (no changes)\n";
}
echo "\n";

if (!is_file($schemaFile)) {
    echo "✗ Schema file not found: {$schemaFile}\n";
    exit(1);
}

if (!preg_match('/^[A-Za-z0-9_]+$/', $dbname)) {
    echo "✗ Invalid DB_NAME '{$dbname}' (letters, digits and underscore only)\n";
    exit(1);
}

try {
    $pdoServer = new PDO(
        "mysql:host={$host};port={$port};charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    if ($fresh) {
        if ($dryRun) {
            echo "  [DRY RUN] would DROP + recreate `{$dbname}`, then import schema.sql\n";
        } else {
            echo "*** FRESH: dropping database `{$dbname}` ***\n";
            $pdoServer->exec("DROP DATABASE IF EXISTS `{$dbname}`");
        }
    }

    if (!$dryRun) {
        $pdoServer->exec(
            "CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );
    }

    $pdo = $dryRun ? null : new PDO(
        "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Multi-statement dump needs emulated prepares.
            PDO::ATTR_EMULATE_PREPARES => true,
        ]
    );
    echo "✓ Connected (database `{$dbname}` ready)\n\n";
} catch (PDOException $e) {
    echo "✗ Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

if ($dryRun) {
    $sql = file_get_contents($schemaFile);
    echo "  [DRY RUN] would import schema.sql (" . strlen((string) $sql) . " bytes)\n";
    echo "\n========================================\n";
    echo "  DRY RUN COMPLETE\n";
    echo "========================================\n";
    exit(0);
}

// Idempotent: only import when core tables are missing.
$hasUsers = (bool) $pdo->query("SHOW TABLES LIKE 'users'")->fetchColumn();
if ($hasUsers && !$fresh) {
    $count = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()")->fetchColumn();
    echo "Already initialized ({$count} tables) — nothing to do.\n";
    echo "\n========================================\n";
    echo "  ✓ SETUP COMPLETE — no changes\n";
    echo "========================================\n";
    exit(0);
}

echo "Importing schema.sql ...\n";
try {
    $pdo->exec((string) file_get_contents($schemaFile));
    echo "  ✓ imported\n";
} catch (Throwable $e) {
    echo "  ✗ FAILED: " . $e->getMessage() . "\n";
    exit(1);
}

$count = (int) $pdo->query("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()")->fetchColumn();
$missing = [];
foreach (['users', 'user_credentials', 'user_sessions', 'login_attempts', 'blacklisted_tokens', 'posts'] as $t) {
    $ok = (bool) $pdo->query("SHOW TABLES LIKE '{$t}'")->fetchColumn();
    if (!$ok) $missing[] = $t;
}

echo "\n========================================\n";
if ($missing) {
    echo "  ✗ COMPLETED WITH ERRORS — missing: " . implode(', ', $missing) . "\n";
    exit(1);
}
echo "  ✓ SETUP COMPLETE — {$count} tables ready\n";
echo "========================================\n";
