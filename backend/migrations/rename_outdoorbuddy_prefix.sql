-- Migration: strip legacy `outdoorbuddy_` table prefix (e.g. `outdoorbuddy_users` -> `users`)
-- Idempotent: each RENAME runs only when the old table exists and the new one does not,
-- so fresh installs (baseline dump already uses new names) are safe no-ops.
-- Covers all 27 tables from the original baseline dump.

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_activity');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_activity` TO `activity`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_activity_image');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_image');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_activity_image` TO `activity_image`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_activity_rating');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_rating');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_activity_rating` TO `activity_rating`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_admin');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_admin` TO `admin`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_business_profile');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_profile');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_business_profile` TO `business_profile`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_category_location');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'category_location');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_category_location` TO `category_location`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_events');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_events` TO `events`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_event_comment');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_comment');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_event_comment` TO `event_comment`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_event_image');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_image');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_event_image` TO `event_image`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_event_like');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_like');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_event_like` TO `event_like`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_event_rating');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_rating');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_event_rating` TO `event_rating`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_follow');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'follow');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_follow` TO `follow`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_friends');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'friends');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_friends` TO `friends`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_invite');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invite');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_invite` TO `invite`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_login');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_login` TO `login`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_login_admin');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_admin');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_login_admin` TO `login_admin`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_notifications');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_notifications` TO `notifications`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_participants');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participants');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_participants` TO `participants`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_place');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'place');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_place` TO `place`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_place_image');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'place_image');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_place_image` TO `place_image`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_place_rating');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'place_rating');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_place_rating` TO `place_rating`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_posts');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_posts` TO `posts`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_post_comment');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_comment');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_post_comment` TO `post_comment`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_post_image');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_image');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_post_image` TO `post_image`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_post_like');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_like');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_post_like` TO `post_like`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_users');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_users` TO `users`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @old_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outdoorbuddy_user_details');
SET @new_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_details');
SET @sql = IF(@old_exists = 1 AND @new_exists = 0, 'RENAME TABLE `outdoorbuddy_user_details` TO `user_details`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
