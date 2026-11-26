-- Migration: Create user_sessions table for JWT session tracking
-- Run this SQL to add session tracking to the database

CREATE TABLE IF NOT EXISTS `user_sessions` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration: Create login_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS `login_attempts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `ip_address` VARCHAR(45) NOT NULL,
    `user_id` VARCHAR(255) NULL DEFAULT NULL,
    `attempted_at` DATETIME NOT NULL,
    INDEX idx_ip_attempted (ip_address, attempted_at),
    INDEX idx_user_attempted (user_id, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration: Create blacklisted_tokens table for logout/blacklist functionality
CREATE TABLE IF NOT EXISTS `blacklisted_tokens` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `token_jti` VARCHAR(255) NOT NULL UNIQUE,
    `user_id` VARCHAR(255) NOT NULL,
    `blacklisted_at` DATETIME NOT NULL,
    `expires_at` DATETIME NOT NULL,
    INDEX idx_token_jti (token_jti),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
