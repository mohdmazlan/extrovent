-- Extrovent baseline schema (structure only, no seed data).
-- Generated from ref_folder/extrovent.sql which stays local-only.
-- For data restores: import a mysqldump backup separately, then run php migrate.php.

--
-- Database: `outdoorbuddy`
--

-- --------------------------------------------------------

--
-- Table structure for table `chatroom`
--

CREATE TABLE `chatroom` (
  `room_id` int(255) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `datetime` datetime NOT NULL,
  `room_type` int(1) NOT NULL DEFAULT 1,
  `room_image` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chatroom_members`
--

CREATE TABLE `chatroom_members` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `room_id` int(255) NOT NULL,
  `datetime` datetime NOT NULL,
  `admin` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_message`
--

CREATE TABLE `chat_message` (
  `id` int(255) NOT NULL,
  `user_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `room_id` int(255) NOT NULL,
  `message` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `datetime` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity`
--

CREATE TABLE `activity` (
  `id` int(11) NOT NULL,
  `category_Activity` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `coordinate` point NOT NULL,
  `create_date` datetime NOT NULL,
  `last_update` datetime NOT NULL,
  `user_id` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `activity_image`
--

CREATE TABLE `activity_image` (
  `id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `create_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `activity_rating`
--

CREATE TABLE `activity_rating` (
  `id` int(11) NOT NULL,
  `rating` int(1) NOT NULL,
  `review` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `create_date` datetime NOT NULL,
  `last_update` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `admin_id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `f_name` varchar(255) NOT NULL,
  `l_name` varchar(255) NOT NULL,
  `nickname` varchar(255) DEFAULT NULL,
  `create_date` datetime NOT NULL,
  `last_update` datetime NOT NULL,
  `is_super` tinyint(1) NOT NULL,
  `approved` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `business_profile`
--

CREATE TABLE `business_profile` (
  `id` int(11) NOT NULL,
  `avatar` varchar(255) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `reg_no` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `create_date` datetime NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `approved` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `category_location`
--

CREATE TABLE `category_location` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `create_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `event_id` int(16) NOT NULL,
  `category` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `place_id` int(11) NOT NULL,
  `fee` int(11) DEFAULT NULL,
  `start_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci NOT NULL,
  `banner` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `create_date` datetime NOT NULL,
  `last_update` datetime NOT NULL,
  `user_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `business_profile_id` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_comment`
--

CREATE TABLE `event_comment` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `event_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `comment` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `datetime` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- Table structure for table `event_image`
--

CREATE TABLE `event_image` (
  `id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `event_id` int(11) NOT NULL,
  `create_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `event_like`
--

CREATE TABLE `event_like` (
  `id` int(16) NOT NULL,
  `user_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `event_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `datetime` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_rating`
--

CREATE TABLE `event_rating` (
  `id` int(11) NOT NULL,
  `rating` int(1) NOT NULL,
  `review` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `event_id` int(11) NOT NULL,
  `create_date` datetime NOT NULL,
  `last_update` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `follow`
--

CREATE TABLE `follow` (
  `id` int(11) NOT NULL,
  `followers` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `following` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `datetime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `friends`
--

CREATE TABLE `friends` (
  `id` int(16) NOT NULL,
  `user_id1` varchar(30) COLLATE utf8_unicode_ci NOT NULL,
  `user_id2` varchar(30) COLLATE utf8_unicode_ci NOT NULL,
  `approved` enum('0','1') COLLATE utf8_unicode_ci NOT NULL DEFAULT '0',
  `datetime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invite`
--

CREATE TABLE `invite` (
  `id` int(16) NOT NULL,
  `event_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user_id` varchar(30) COLLATE utf8_unicode_ci NOT NULL,
  `receiver` varchar(30) COLLATE utf8_unicode_ci NOT NULL,
  `seen` enum('0','1') COLLATE utf8_unicode_ci NOT NULL DEFAULT '0',
  `datetime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login`
--

CREATE TABLE `login` (
  `login_id` int(16) NOT NULL,
  `user_id` varchar(16) COLLATE utf8_unicode_ci NOT NULL,
  `login_key` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `ip_address` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `last_login` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `login_admin`
--

CREATE TABLE `login_admin` (
  `login_id` int(11) NOT NULL,
  `admin_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `login_key` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `ip_address` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `last_login` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `sid` int(11) DEFAULT NULL,
  `user_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_ids` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('1','2','3','4','5') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '1:friend request, 2:invitation,3:chat message, 4:custom, 5:post comment',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `banner` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `datetime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `participants`
--

CREATE TABLE `participants` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `event_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `datetime` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `place`
--

CREATE TABLE `place` (
  `id` int(11) NOT NULL,
  `category_location` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `coordinate` point NOT NULL,
  `create_date` datetime NOT NULL,
  `last_update` datetime NOT NULL,
  `verified` int(1) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `business_profile_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `place_image`
--

CREATE TABLE `place_image` (
  `id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `place_id` int(11) NOT NULL,
  `create_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `place_rating`
--

CREATE TABLE `place_rating` (
  `id` int(11) NOT NULL,
  `rating` int(1) NOT NULL,
  `review` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `place_id` int(11) NOT NULL,
  `create_date` datetime NOT NULL,
  `last_update` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `post_id` int(16) NOT NULL,
  `caption` longtext COLLATE utf8_unicode_ci NOT NULL,
  `banner` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `type` enum('1','2','3','6') COLLATE utf8_unicode_ci NOT NULL DEFAULT '1',
  `date_cr8` datetime NOT NULL,
  `last_update` datetime NOT NULL,
  `user_id` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `place_id` int(11) DEFAULT NULL,
  `event_id` int(11) DEFAULT NULL,
  `activity_id` int(11) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_comment`
--

CREATE TABLE `post_comment` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `post_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `comment` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `datetime` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

-- --------------------------------------------------------

--
-- Table structure for table `post_image`
--

CREATE TABLE `post_image` (
  `id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `post_id` int(11) NOT NULL,
  `create_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `post_like`
--

CREATE TABLE `post_like` (
  `id` int(16) NOT NULL,
  `user_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `post_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `datetime` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` varchar(16) COLLATE utf8_unicode_ci NOT NULL,
  `nickname` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `gender` enum('m','f') COLLATE utf8_unicode_ci NOT NULL,
  `ip_address` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `signup` datetime NOT NULL,
  `lastlogin` datetime NOT NULL,
  `lastseen` datetime NOT NULL,
  `avatar` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_details`
--

CREATE TABLE `user_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `first_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `last_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `no_ic` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `no_matrik` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `no_phone` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
