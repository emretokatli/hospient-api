#!/usr/bin/env node

/**
 * Script to run the concierge database migration
 * Usage: node run-concierge-migration.js
 */

const { Sequelize } = require('sequelize');
const config = require('./src/config/database');

async function runMigration() {
  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      dialect: 'mysql',
      logging: console.log,
    }
  );

  try {
    console.log('Starting concierge migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Create concierge_categories table
    console.log('Creating concierge_categories table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS concierge_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES concierge_categories(id) ON UPDATE CASCADE ON DELETE SET NULL,
        INDEX idx_parent_id (parent_id),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create concierge_requests table
    console.log('Creating concierge_requests table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS concierge_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hotel_id INT NOT NULL,
        guest_id INT NULL,
        category_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        details TEXT NULL COMMENT 'JSON payload for additional request details',
        status ENUM('requested', 'in_progress', 'done', 'cancelled') DEFAULT 'requested' NOT NULL,
        scheduled_for DATETIME NULL,
        completed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON UPDATE CASCADE ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES concierge_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        INDEX idx_hotel_id (hotel_id),
        INDEX idx_category_id (category_id),
        INDEX idx_status (status),
        INDEX idx_guest_id (guest_id),
        INDEX idx_created_at (created_at),
        INDEX idx_scheduled_for (scheduled_for)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Insert sample categories
    console.log('Inserting sample categories...');
    await sequelize.query(`
      INSERT IGNORE INTO concierge_categories (name, description, created_at, updated_at) VALUES
      ('Transportation', 'Transportation and travel services', NOW(), NOW()),
      ('Dining & Reservations', 'Restaurant reservations and dining services', NOW(), NOW()),
      ('Entertainment', 'Entertainment and activity bookings', NOW(), NOW()),
      ('Spa & Wellness', 'Spa treatments and wellness services', NOW(), NOW()),
      ('Business Services', 'Business and meeting room services', NOW(), NOW()),
      ('Housekeeping', 'Housekeeping and room service requests', NOW(), NOW());
    `);

    console.log('✅ Concierge migration completed successfully!');
    console.log('📋 Tables created:');
    console.log('   - concierge_categories');
    console.log('   - concierge_requests');
    console.log('📋 Sample data inserted: 6 categories');
    console.log('🔗 API endpoints available at:');
    console.log('   - GET    /api/concierge/categories');
    console.log('   - POST   /api/concierge/categories');
    console.log('   - GET    /api/concierge/requests');
    console.log('   - POST   /api/concierge/requests');
    console.log('   - GET    /api/concierge/requests/:id');
    console.log('   - PUT    /api/concierge/requests/:id');
    console.log('   - DELETE /api/concierge/requests/:id');
    console.log('📚 Swagger documentation: http://localhost:3000/api-docs');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigration(); 