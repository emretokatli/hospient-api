-- Create wellness_spa table
CREATE TABLE IF NOT EXISTS `wellness_spa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hotel_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` varchar(100) NOT NULL COMMENT 'e.g., "spa", "wellness_center", "fitness_center", "massage_therapy", "package"',
  `features` text DEFAULT NULL COMMENT 'JSON string of features or comma-separated list',
  `working_hours` text DEFAULT NULL COMMENT 'JSON string with days of week and open/close times',
  `images` text DEFAULT NULL COMMENT 'JSON string array of image objects with url and index',
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_hotel_id` (`hotel_id`),
  KEY `idx_type` (`type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_wellness_spa_hotel` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample data for testing
INSERT INTO `wellness_spa` (`hotel_id`, `name`, `description`, `type`, `features`, `working_hours`, `images`, `is_active`, `sort_order`) VALUES
(1, 'Luxury Spa & Wellness Center', 'Experience ultimate relaxation with our premium spa services', 'spa', 'Massage therapy, Facial treatments, Body wraps, Sauna, Steam room', 
'{"monday":{"open":"09:00:00","close":"20:00:00"},"tuesday":{"open":"09:00:00","close":"20:00:00"},"wednesday":{"open":"09:00:00","close":"20:00:00"},"thursday":{"open":"09:00:00","close":"20:00:00"},"friday":{"open":"09:00:00","close":"21:00:00"},"saturday":{"open":"10:00:00","close":"21:00:00"},"sunday":{"open":"10:00:00","close":"18:00:00"}}',
'[{"url":"https://example.com/spa1.jpg","index":"1"},{"url":"https://example.com/spa2.jpg","index":"2"}]', 1, 1),
(1, 'Fitness Center', 'State-of-the-art fitness equipment and personal training services', 'fitness_center', 'Cardio machines, Weight training, Personal trainers, Group classes, Yoga studio',
'{"monday":{"open":"06:00:00","close":"22:00:00"},"tuesday":{"open":"06:00:00","close":"22:00:00"},"wednesday":{"open":"06:00:00","close":"22:00:00"},"thursday":{"open":"06:00:00","close":"22:00:00"},"friday":{"open":"06:00:00","close":"22:00:00"},"saturday":{"open":"07:00:00","close":"21:00:00"},"sunday":{"open":"07:00:00","close":"21:00:00"}}',
'[{"url":"https://example.com/gym1.jpg","index":"1"},{"url":"https://example.com/gym2.jpg","index":"2"}]', 1, 2),
(1, 'Swimming Pool & Jacuzzi', 'Relaxing pool area with heated jacuzzi', 'swimming_pool', 'Heated pool, Jacuzzi, Poolside service, Towel service',
'{"monday":{"open":"07:00:00","close":"22:00:00"},"tuesday":{"open":"07:00:00","close":"22:00:00"},"wednesday":{"open":"07:00:00","close":"22:00:00"},"thursday":{"open":"07:00:00","close":"22:00:00"},"friday":{"open":"07:00:00","close":"22:00:00"},"saturday":{"open":"08:00:00","close":"22:00:00"},"sunday":{"open":"08:00:00","close":"22:00:00"}}',
'[{"url":"https://example.com/pool1.jpg","index":"1"}]', 1, 3);