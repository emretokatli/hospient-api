'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create concierge_categories table
    await queryInterface.createTable('concierge_categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { 
          model: 'concierge_categories', 
          key: 'id' 
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      name: { 
        type: Sequelize.STRING(255), 
        allowNull: false 
      },
      description: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Create concierge_requests table
    await queryInterface.createTable('concierge_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      hotel_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { 
          model: 'hotels', 
          key: 'id' 
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      guest_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        // Note: This could reference members, bookings, or rooms depending on your system
        // references: { model: 'members', key: 'id' },
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { 
          model: 'concierge_categories', 
          key: 'id' 
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      title: { 
        type: Sequelize.STRING(255), 
        allowNull: false 
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON payload for additional request details',
      },
      status: {
        type: Sequelize.ENUM('requested', 'in_progress', 'done', 'cancelled'),
        defaultValue: 'requested',
        allowNull: false,
      },
      scheduled_for: { 
        type: Sequelize.DATE, 
        allowNull: true 
      },
      completed_at: { 
        type: Sequelize.DATE, 
        allowNull: true 
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes for better performance
    await queryInterface.addIndex('concierge_categories', ['parent_id']);
    await queryInterface.addIndex('concierge_categories', ['name']);
    
    await queryInterface.addIndex('concierge_requests', ['hotel_id']);
    await queryInterface.addIndex('concierge_requests', ['category_id']);
    await queryInterface.addIndex('concierge_requests', ['status']);
    await queryInterface.addIndex('concierge_requests', ['guest_id']);
    await queryInterface.addIndex('concierge_requests', ['created_at']);
    await queryInterface.addIndex('concierge_requests', ['scheduled_for']);

    // Insert some sample categories
    await queryInterface.bulkInsert('concierge_categories', [
      {
        name: 'Transportation',
        description: 'Transportation and travel services',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Dining & Reservations',
        description: 'Restaurant reservations and dining services',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Entertainment',
        description: 'Entertainment and activity bookings',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Spa & Wellness',
        description: 'Spa treatments and wellness services',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Business Services',
        description: 'Business and meeting room services',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Housekeeping',
        description: 'Housekeeping and room service requests',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('concierge_requests');
    await queryInterface.dropTable('concierge_categories');
  }
}; 