'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('meeting_rooms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      capacity: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Capacity as string (e.g., "10-20 people", "Boardroom style")'
      },
      features: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Features and amenities of the meeting room'
      },
      images: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Array of image objects with url and index'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('meeting_rooms', ['hotel_id']);
    await queryInterface.addIndex('meeting_rooms', ['name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('meeting_rooms');
  }
}; 