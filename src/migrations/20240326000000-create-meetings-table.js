'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('meetings', {
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
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      event_type: {
        type: Sequelize.ENUM('meeting', 'conference', 'wedding', 'birthday', 'corporate_event', 'other'),
        allowNull: false,
        defaultValue: 'meeting'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Maximum number of attendees'
      },
      current_attendees: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Meeting room or venue location'
      },
      organizer_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      organizer_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      organizer_phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'confirmed', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this event is visible to public/guests'
      },
      requires_approval: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this event requires hotel approval'
      },
      special_requirements: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Special requirements or notes'
      },
      catering_required: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      equipment_required: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Required equipment (JSON string)'
      },
      budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Event budget'
      },
      deposit_paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      deposit_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      total_cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Internal notes for hotel staff'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID of the member who created this meeting',
        references: {
          model: 'members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID of the member who approved this meeting',
        references: {
          model: 'members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('meetings', ['hotel_id']);
    await queryInterface.addIndex('meetings', ['event_type']);
    await queryInterface.addIndex('meetings', ['status']);
    await queryInterface.addIndex('meetings', ['start_date']);
    await queryInterface.addIndex('meetings', ['end_date']);
    await queryInterface.addIndex('meetings', ['is_public']);
    await queryInterface.addIndex('meetings', ['organizer_email']);
    await queryInterface.addIndex('meetings', ['created_by']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('meetings');
  }
}; 