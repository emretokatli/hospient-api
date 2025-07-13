'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('communications', {
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
      type: {
        type: Sequelize.ENUM('feedback', 'chat', 'notification', 'push_notification'),
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('general', 'service', 'room', 'restaurant', 'spa', 'activity', 'emergency', 'promotion'),
        allowNull: false,
        defaultValue: 'general'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      sender_type: {
        type: Sequelize.ENUM('hotel', 'guest', 'staff'),
        allowNull: false
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID of the sender (guest_id, staff_id, or null for hotel)'
      },
      sender_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      recipient_type: {
        type: Sequelize.ENUM('guest', 'walkin', 'all', 'specific'),
        allowNull: false,
        defaultValue: 'all'
      },
      recipient_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Specific recipient ID if recipient_type is specific'
      },
      recipient_device_token: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Device token for push notifications'
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal'
      },
      status: {
        type: Sequelize.ENUM('draft', 'sent', 'delivered', 'read', 'failed'),
        defaultValue: 'draft'
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'For scheduled notifications'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Expiration time for notifications'
      },
      metadata: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional data like images, links, actions, etc. (JSON string)'
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        },
        comment: 'For feedback type communications'
      },
      response_to_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'communications',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'For chat replies'
      },
      is_anonymous: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'For anonymous feedback'
      },
      tags: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Tags for categorizing communications (JSON string)'
      },
      language: {
        type: Sequelize.STRING(10),
        defaultValue: 'en',
        comment: 'Language of the communication'
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
    await queryInterface.addIndex('communications', ['hotel_id']);
    await queryInterface.addIndex('communications', ['type']);
    await queryInterface.addIndex('communications', ['category']);
    await queryInterface.addIndex('communications', ['sender_type']);
    await queryInterface.addIndex('communications', ['recipient_type']);
    await queryInterface.addIndex('communications', ['status']);
    await queryInterface.addIndex('communications', ['priority']);
    await queryInterface.addIndex('communications', ['scheduled_at']);
    await queryInterface.addIndex('communications', ['created_at']);
    await queryInterface.addIndex('communications', ['response_to_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('communications');
  }
}; 