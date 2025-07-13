-- MariaDB Meeting Rooms Table Creation Script
-- Compatible with older versions of MariaDB

-- Create the meeting_rooms table
CREATE TABLE `meeting_rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hotel_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `capacity` varchar(100) DEFAULT NULL COMMENT 'Capacity as string (e.g., "10-20 people", "Boardroom style")',
  `features` text DEFAULT NULL COMMENT 'Features and amenities of the meeting room',
  `images` longtext DEFAULT NULL COMMENT 'Array of image objects with url and index (JSON format)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_meeting_rooms_hotel_id` (`hotel_id`),
  KEY `idx_meeting_rooms_name` (`name`),
  CONSTRAINT `fk_meeting_rooms_hotel_id` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments to the table
ALTER TABLE `meeting_rooms` COMMENT='Meeting rooms and conference spaces for hotels';

-- Verify the table was created successfully
-- DESCRIBE meeting_rooms; 