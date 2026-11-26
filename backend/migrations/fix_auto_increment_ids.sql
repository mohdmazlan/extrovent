-- Repair missing AUTO_INCREMENT keys across all baseline tables.
-- Fresh installs from the fixed baseline-schema.sql already have these;
-- this repairs databases built from the original phpMyAdmin dump.
-- Every step is conditional: tables with duplicate key values are left
-- untouched (needs manual dedupe), everything else converges to the
-- dev-database shape. Safe to re-run.

-- chatroom.room_id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatroom' AND COLUMN_NAME = 'room_id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `room_id` FROM `chatroom` GROUP BY `room_id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `chatroom` ADD PRIMARY KEY (`room_id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatroom' AND COLUMN_NAME = 'room_id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatroom' AND COLUMN_NAME = 'room_id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `chatroom` MODIFY `room_id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- chatroom_members.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatroom_members' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `chatroom_members` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `chatroom_members` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatroom_members' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatroom_members' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `chatroom_members` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- chat_message.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_message' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `chat_message` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `chat_message` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_message' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_message' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `chat_message` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- activity.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `activity` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `activity` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `activity` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- activity_image.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_image' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `activity_image` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `activity_image` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_image' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_image' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `activity_image` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- activity_rating.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_rating' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `activity_rating` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `activity_rating` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_rating' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activity_rating' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `activity_rating` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- business_profile.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_profile' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `business_profile` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `business_profile` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_profile' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_profile' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `business_profile` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- category_location.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'category_location' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `category_location` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `category_location` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'category_location' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'category_location' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `category_location` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- events.event_id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events' AND COLUMN_NAME = 'event_id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `event_id` FROM `events` GROUP BY `event_id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `events` ADD PRIMARY KEY (`event_id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events' AND COLUMN_NAME = 'event_id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'events' AND COLUMN_NAME = 'event_id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `events` MODIFY `event_id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- event_image.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_image' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `event_image` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `event_image` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_image' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_image' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `event_image` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- event_like.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_like' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `event_like` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `event_like` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_like' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_like' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `event_like` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- event_rating.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_rating' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `event_rating` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `event_rating` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_rating' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_rating' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `event_rating` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- follow.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'follow' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `follow` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `follow` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'follow' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'follow' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `follow` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- friends.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'friends' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `friends` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `friends` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'friends' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'friends' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `friends` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- invite.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invite' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `invite` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `invite` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invite' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'invite' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `invite` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- login.login_id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login' AND COLUMN_NAME = 'login_id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `login_id` FROM `login` GROUP BY `login_id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `login` ADD PRIMARY KEY (`login_id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login' AND COLUMN_NAME = 'login_id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login' AND COLUMN_NAME = 'login_id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `login` MODIFY `login_id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- login_admin.login_id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_admin' AND COLUMN_NAME = 'login_id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `login_id` FROM `login_admin` GROUP BY `login_id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `login_admin` ADD PRIMARY KEY (`login_id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_admin' AND COLUMN_NAME = 'login_id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'login_admin' AND COLUMN_NAME = 'login_id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `login_admin` MODIFY `login_id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- notifications.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `notifications` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `notifications` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `notifications` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- participants.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participants' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `participants` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `participants` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participants' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'participants' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `participants` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- place.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'place' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `place` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `place` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'place' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'place' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `place` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- place_image.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'place_image' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `place_image` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `place_image` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'place_image' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'place_image' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `place_image` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- place_rating.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'place_rating' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `place_rating` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `place_rating` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'place_rating' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'place_rating' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `place_rating` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- posts.post_id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'post_id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `post_id` FROM `posts` GROUP BY `post_id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `posts` ADD PRIMARY KEY (`post_id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'post_id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'post_id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `posts` MODIFY `post_id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- post_image.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_image' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `post_image` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `post_image` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_image' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_image' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `post_image` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- post_like.id : PRIMARY KEY + AUTO_INCREMENT
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_like' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `post_like` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `post_like` ADD PRIMARY KEY (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_like' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_like' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `post_like` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- event_comment.id : UNIQUE KEY + AUTO_INCREMENT (matches dev shape: no PK)
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_comment' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `event_comment` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `event_comment` ADD UNIQUE KEY `id` (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_comment' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'event_comment' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `event_comment` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- post_comment.id : UNIQUE KEY + AUTO_INCREMENT (matches dev shape: no PK)
SET @has_key = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_comment' AND COLUMN_NAME = 'id');
SET @dup = (SELECT COUNT(*) FROM (SELECT `id` FROM `post_comment` GROUP BY `id` HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_key = 0 AND @dup = 0, 'ALTER TABLE `post_comment` ADD UNIQUE KEY `id` (`id`)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @has_key2 = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_comment' AND COLUMN_NAME = 'id');
SET @is_ai = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'post_comment' AND COLUMN_NAME = 'id' AND EXTRA LIKE '%auto_increment%');
SET @sql2 = IF(@has_key2 > 0 AND @is_ai = 0, 'ALTER TABLE `post_comment` MODIFY `id` INT NOT NULL AUTO_INCREMENT', 'SELECT 1');
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- users.user_id : PRIMARY KEY (dev shape; signup/login assume uniqueness)
SET @has_pk = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND CONSTRAINT_TYPE = 'PRIMARY KEY');
SET @dup = (SELECT COUNT(*) FROM (SELECT user_id FROM users GROUP BY user_id HAVING COUNT(*) > 1) d);
SET @sql = IF(@has_pk = 0 AND @dup = 0, 'ALTER TABLE users ADD PRIMARY KEY (user_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
