-- Fix user_details.id: the legacy schema defines it as plain NOT NULL with
-- no default and no auto-increment, so inserts that only supply user_id fail
-- under strict SQL mode (ERROR 1364 Field 'id' doesn't have a default value).
-- `id` is never referenced anywhere (all joins use user_id), so renumbering
-- existing rows is safe. Every step is conditional, so the migration is a
-- safe no-op on databases that already have the fixed shape.

-- 1. Compact ids to a unique 1..N sequence (no-op when already unique).
SET @i = 0;
UPDATE `user_details` SET `id` = (@i := @i + 1) ORDER BY `id`, `user_id`;

-- 2. Drop PRIMARY KEY if it exists on anything other than `id` alone.
SET @pk_total = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_details' AND INDEX_NAME = 'PRIMARY');
SET @pk_id_only = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_details' AND INDEX_NAME = 'PRIMARY' AND COLUMN_NAME = 'id');
SET @sql = IF(@pk_total > 0 AND NOT (@pk_total = 1 AND @pk_id_only = 1), 'ALTER TABLE `user_details` DROP PRIMARY KEY', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Ensure UNIQUE(user_id), unless duplicates exist (then leave data alone).
SET @has_uidx = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_details' AND COLUMN_NAME = 'user_id' AND NON_UNIQUE = 0);
SET @dup_uid = (SELECT COUNT(*) FROM (SELECT `user_id` FROM `user_details` GROUP BY `user_id` HAVING COUNT(*) > 1) d);
SET @sql2 = IF(@has_uidx = 0 AND @dup_uid = 0, 'ALTER TABLE `user_details` ADD UNIQUE KEY `user_id` (`user_id`)', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- 4. Promote id to AUTO_INCREMENT PRIMARY KEY unless already done.
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_details' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql3 = IF(@is_ai = 0, 'ALTER TABLE `user_details` MODIFY `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY', 'SELECT 1');
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;
