<?php

/**
 * Extrovent Database Migration Runner (HRMS-style)
 *
 * Runs every *.sql file in backend/migrations/ in filename order,
 * tracking applied files in `schema_migrations` so re-runs are safe.
 *
 * Usage:
 *   php migrate.php                  Run pending migrations
 *   php migrate.php --list            Show applied / pending files
 *   php migrate.php --dry-run         Show what would run, change nothing
 *   php migrate.php --file=foo.sql    Run one file only (even if applied)
 *   php migrate.php --baseline        Import ref_folder/extrovent.sql first
 *                                     if core tables are missing
 *   php migrate.php --fresh           Drop auth tables + clear tracking, re-run all
 *                                     (destructive — dev only)
 *
 * Env (.env): DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS
 */

require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$args = $argv ?? [];
$dryRun     = in_array('--dry-run', $args, true);
$listOnly   = in_array('--list', $args, true);
$baseline   = in_array('--baseline', $args, true);
$fresh      = in_array('--fresh', $args, true);
$singleFile = null;
foreach ($args as $a) {
    if (str_starts_with($a, '--file=')) {
        $singleFile = substr($a, strlen('--file='));
    }
}

$host   = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port   = $_ENV['DB_PORT'] ?? '3306';
$dbname = $_ENV['DB_NAME'] ?? 'extrovent';
$user   = $_ENV['DB_USER'] ?? 'root';
$pass   = $_ENV['DB_PASS'] ?? '';

$migrationsDir = __DIR__ . '/migrations';
$baselineFile  = realpath(__DIR__ . '/../ref_folder/extrovent.sql')
    ?: (__DIR__ . '/../ref_folder/extrovent.sql');

echo "========================================\n";
echo "  Extrovent Database Migration Runner\n";
echo "========================================\n\n";
echo "DB: {$dbname}@{$host}:{$port}  user: {$user}\n";
echo "Migrations dir: {$migrationsDir}\n";
if ($dryRun) {
    echo "Mode: DRY RUN (no changes)\n";
}
echo "\n";

if (!is_dir($migrationsDir)) {
    echo "✗ Migrations directory not found: {$migrationsDir}\n";
    exit(1);
}

try {
    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            // Multi-statement dumps (phpMyAdmin) need emulated prepares.
            PDO::ATTR_EMULATE_PREPARES => true,
        ]
    );
    echo "✓ Connected\n\n";
} catch (PDOException $e) {
    echo "✗ Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Tracking table so migrations are idempotent.
$pdo->exec(
    "CREATE TABLE IF NOT EXISTS `schema_migrations` (
        `filename` VARCHAR(255) NOT NULL PRIMARY KEY,
        `checksum` VARCHAR(64) NOT NULL,
        `applied_at` DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
);

function isApplied(PDO $pdo, string $filename): bool
{
    $stmt = $pdo->prepare("SELECT 1 FROM schema_migrations WHERE filename = ?");
    $stmt->execute([$filename]);
    return (bool) $stmt->fetchColumn();
}

function markApplied(PDO $pdo, string $filename, string $checksum, bool $dryRun): void
{
    if ($dryRun) {
        return;
    }
    $stmt = $pdo->prepare(
        "INSERT INTO schema_migrations (filename, checksum, applied_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE checksum = VALUES(checksum), applied_at = VALUES(applied_at)"
    );
    $stmt->execute([$filename, $checksum]);
}

function runSqlFile(PDO $pdo, string $path, bool $dryRun): void
{
    $sql = file_get_contents($path);
    if ($sql === false || trim($sql) === '') {
        echo "  - empty file, skipped\n";
        return;
    }
    if ($dryRun) {
        echo "  [DRY RUN] would execute " . basename($path) . " (" . strlen($sql) . " bytes)\n";
        return;
    }
    // PDO::exec with EMULATE_PREPARES handles multi-statement dumps.
    $pdo->exec($sql);
    echo "  ✓ executed\n";
}

// --fresh: dev-only reset of tables owned by our migrations.
if ($fresh) {
    echo "*** FRESH: dropping auth tables and clearing tracking ***\n";
    if ($dryRun) {
        echo "  [DRY RUN] would drop user_sessions, login_attempts, blacklisted_tokens\n\n";
    } else {
        $pdo->exec("DROP TABLE IF EXISTS `user_sessions`");
        $pdo->exec("DROP TABLE IF EXISTS `login_attempts`");
        $pdo->exec("DROP TABLE IF EXISTS `blacklisted_tokens`");
        $pdo->exec("DELETE FROM schema_migrations");
        echo "  ✓ dropped + tracking cleared\n\n";
    }
}

// --baseline: import core schema dump if core tables are missing.
if ($baseline) {
    $hasUsers = (bool) $pdo->query("SHOW TABLES LIKE 'users'")->fetchColumn();
    if ($hasUsers) {
        echo "Baseline: users exists, skipping baseline import.\n\n";
    } elseif (!is_file($baselineFile)) {
        echo "✗ Baseline requested but file not found: {$baselineFile}\n";
        exit(1);
    } else {
        echo "Baseline: importing " . basename((string) $baselineFile) . " ...\n";
        runSqlFile($pdo, (string) $baselineFile, $dryRun);
        echo "\n";
    }
}

// Collect migration files.
$files = glob($migrationsDir . '/*.sql') ?: [];
sort($files, SORT_STRING);
if ($singleFile !== null) {
    $files = array_values(array_filter($files, fn($f) => basename($f) === $singleFile));
    if (empty($files)) {
        echo "✗ File not found in migrations/: {$singleFile}\n";
        exit(1);
    }
}

if (empty($files)) {
    echo "No .sql files in migrations/.\n";
    exit(0);
}

if ($listOnly) {
    echo "Migrations:\n";
    foreach ($files as $f) {
        $name = basename($f);
        $state = isApplied($pdo, $name) ? 'applied' : 'pending';
        echo "  [{$state}] {$name}\n";
    }
    exit(0);
}

$ok = 0;
$skipped = 0;
$failed = 0;

foreach ($files as $f) {
    $name = basename($f);
    $already = $singleFile === null && isApplied($pdo, $name);
    echo "- {$name}: " . ($already ? "already applied, skipped\n" : "applying...\n");
    if ($already) {
        $skipped++;
        continue;
    }
    try {
        runSqlFile($pdo, $f, $dryRun);
        if (!$dryRun) {
            markApplied($pdo, $name, hash_file('sha256', $f) ?: '', false);
        }
        $ok++;
    } catch (Throwable $e) {
        $failed++;
        echo "  ✗ FAILED: " . $e->getMessage() . "\n";
        // Stop on first failure so later files don't run on a broken schema.
        break;
    }
}

echo "\n========================================\n";
if ($dryRun) {
    echo "  DRY RUN COMPLETE — {$ok} would run, {$skipped} already applied, {$failed} would fail\n";
} elseif ($failed > 0) {
    echo "  ✗ COMPLETED WITH ERRORS — applied: {$ok}, skipped: {$skipped}, failed: {$failed}\n";
    exit(1);
} else {
    echo "  ✓ MIGRATION SUCCESSFUL — applied: {$ok}, skipped: {$skipped}\n";
}
echo "========================================\n";
