'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('wellness_spa', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      hotel_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'hotels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'e.g., "spa", "wellness_center", "fitness_center", "massage_therapy", "package"'
      },
      features: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON string of features or comma-separated list'
      },
      working_hours: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON string with days of week and open/close times'
      },
      images: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON string array of image objects with url and index'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('wellness_spa', ['hotel_id']);
    await queryInterface.addIndex('wellness_spa', ['type']);
    await queryInterface.addIndex('wellness_spa', ['is_active']);
    await queryInterface.addIndex('wellness_spa', ['sort_order']);
    await queryInterface.addIndex('wellness_spa', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('wellness_spa');
  }
}; 