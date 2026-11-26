<?php

/**
 * Database Migration Script for JWT Authentication System
 * 
 * This script:
 * 1. Creates new tables for JWT auth (user_sessions, blacklisted_tokens, login_attempts)
 * 2. Optionally migrates existing md5 passwords to bcrypt
 * 
 * Usage: php migrate_auth.php [--migrate-passwords] [--dry-run]
 */

require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

// Load environment
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Parse command line arguments
$args = $argv;
$migratePasswords = in_array('--migrate-passwords', $args);
$dryRun = in_array('--dry-run', $args);

echo "========================================\n";
echo "  Auth System Database Migration\n";
echo "========================================\n\n";

// Database configuration from .env
$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port = $_ENV['DB_PORT'] ?? '3306';
$dbname = $_ENV['DB_NAME'] ?? 'extrovent';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '';

echo "Connecting to database: {$dbname}@{$host}:{$port}\n";

try {
    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4",
        $user,
        $pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    echo "✓ Connected successfully\n\n";
} catch (PDOException $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

/**
 * Check if a table exists
 */
function tableExists(PDO $pdo, string $tableName): bool
{
    $stmt = $pdo->query("SHOW TABLES LIKE '{$tableName}'");
    return $stmt->rowCount() > 0;
}

/**
 * Create user_sessions table
 */
function createSessionsTable(PDO $pdo, bool $dryRun = false): bool
{
    $sql = "CREATE TABLE IF NOT EXISTS `user_sessions` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `session_id` VARCHAR(255) NOT NULL UNIQUE,
        `user_id` VARCHAR(255) NOT NULL,
        `ip_address` VARCHAR(45) NOT NULL,
        `device_info` TEXT DEFAULT NULL,
        `login_at` DATETIME NOT NULL,
        `last_activity_at` DATETIME NOT NULL,
        `expires_at` DATETIME NOT NULL,
        `status` ENUM('active', 'revoked', 'expired') DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_session_id (session_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($dryRun) {
        echo "  [DRY RUN] Would create user_sessions table\n";
        return true;
    }

    try {
        $pdo->exec($sql);
        echo "  ✓ Created user_sessions table\n";
        return true;
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "  - user_sessions table already exists (skipped)\n";
            return true;
        }
        echo "  ✗ Failed to create user_sessions: " . $e->getMessage() . "\n";
        return false;
    }
}

/**
 * Create blacklisted_tokens table
 */
function createBlacklistedTokensTable(PDO $pdo, bool $dryRun = false): bool
{
    $sql = "CREATE TABLE IF NOT EXISTS `blacklisted_tokens` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `token_jti` VARCHAR(255) NOT NULL UNIQUE,
        `user_id` VARCHAR(255) NOT NULL,
        `blacklisted_at` DATETIME NOT NULL,
        `expires_at` DATETIME NOT NULL,
        INDEX idx_token_jti (token_jti),
        INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($dryRun) {
        echo "  [DRY RUN] Would create blacklisted_tokens table\n";
        return true;
    }

    try {
        $pdo->exec($sql);
        echo "  ✓ Created blacklisted_tokens table\n";
        return true;
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "  - blacklisted_tokens table already exists (skipped)\n";
            return true;
        }
        echo "  ✗ Failed to create blacklisted_tokens: " . $e->getMessage() . "\n";
        return false;
    }
}

/**
 * Create login_attempts table for rate limiting
 */
function createLoginAttemptsTable(PDO $pdo, bool $dryRun = false): bool
{
    $sql = "CREATE TABLE IF NOT EXISTS `login_attempts` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `ip_address` VARCHAR(45) NOT NULL,
        `user_id` VARCHAR(255) NULL DEFAULT NULL,
        `attempted_at` DATETIME NOT NULL,
        INDEX idx_ip_attempted (ip_address, attempted_at),
        INDEX idx_user_attempted (user_id, attempted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($dryRun) {
        echo "  [DRY RUN] Would create login_attempts table\n";
        return true;
    }

    try {
        $pdo->exec($sql);
        echo "  ✓ Created login_attempts table\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') === false) {
            echo "  ✗ Failed to create login_attempts: " . $e->getMessage() . "\n";
            return false;
        }
        echo "  - login_attempts table already exists (checking columns...)\n";
    }

    // Ensure user_id column exists on tables created by older migrations
    $cols = $pdo->query("SHOW COLUMNS FROM login_attempts")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('user_id', $cols, true)) {
        $pdo->exec("ALTER TABLE login_attempts ADD COLUMN user_id VARCHAR(255) NULL DEFAULT NULL AFTER ip_address");
        echo "  ✓ Added user_id column to login_attempts\n";
    }
    try {
        $pdo->exec("ALTER TABLE login_attempts ADD INDEX idx_user_attempted (user_id, attempted_at)");
        echo "  ✓ Added idx_user_attempted index\n";
    } catch (PDOException $e) {
        // Index already exists (error 1061) — safe to ignore
        if ((int) ($e->errorInfo[1] ?? 0) !== 1061) {
            throw $e;
        }
    }

    return true;
}

/**
 * Migrate existing md5 passwords to bcrypt
 */
function migratePasswords(PDO $pdo, bool $dryRun = false): int
{
    echo "\nChecking for md5 password hashes...\n";
    
    // Find users with md5 passwords (32 hex characters)
    $stmt = $pdo->query("SELECT user_id, password FROM users WHERE CHAR_LENGTH(password) = 32 AND password REGEXP '^[a-f0-9]+$'");
    $md5Users = $stmt->fetchAll();
    
    if (empty($md5Users)) {
        echo "  - No md5 passwords found (all users already using bcrypt)\n";
        return 0;
    }
    
    echo "  Found " . count($md5Users) . " user(s) with md5 passwords\n";
    
    if ($dryRun) {
        echo "  [DRY RUN] Would migrate " . count($md5Users) . " password(s):\n";
        foreach ($md5Users as $user) {
            echo "    - {$user['user_id']}\n";
        }
        return count($md5Users);
    }
    
    $migrated = 0;
    foreach ($md5Users as $user) {
        try {
            // Generate bcrypt hash (will be checked against md5 during login)
            $newHash = password_hash($user['password'], PASSWORD_DEFAULT);
            
            $updateStmt = $pdo->prepare("UPDATE users SET password = ? WHERE user_id = ?");
            $updateStmt->execute([$newHash, $user['user_id']]);
            
            echo "  ✓ Migrated: {$user['user_id']}\n";
            $migrated++;
        } catch (PDOException $e) {
            echo "  ✗ Failed to migrate {$user['user_id']}: " . $e->getMessage() . "\n";
        }
    }
    
    return $migrated;
}

// ========================================
// Run Migrations
// ========================================

$success = true;

echo "Creating tables...\n";

if (!createSessionsTable($pdo, $dryRun)) {
    $success = false;
}

if (!createBlacklistedTokensTable($pdo, $dryRun)) {
    $success = false;
}

if (!createLoginAttemptsTable($pdo, $dryRun)) {
    $success = false;
}

// Optional: Migrate passwords
if ($migratePasswords) {
    echo "\n";
    $migratedCount = migratePasswords($pdo, $dryRun);
    echo "\nMigrated {$migratedCount} password(s)\n";
}

echo "\n========================================\n";
if ($dryRun) {
    echo "  DRY RUN COMPLETE - No changes were made\n";
    echo "  Run with --migrate-passwords to also migrate passwords\n";
} else {
    if ($success) {
        echo "  ✓ MIGRATION SUCCESSFUL\n";
        echo "\nNext steps:\n";
        echo "  1. Set JWT_SECRET in your .env file\n";
        echo "  2. Test login: curl -X POST http://localhost/api/auth/login\n";
        echo "  3. Check Swagger UI: http://localhost/swagger\n";
    } else {
        echo "  ✗ MIGRATION COMPLETED WITH ERRORS\n";
        echo "  Check the messages above for details\n";
    }
}
echo "========================================\n";
