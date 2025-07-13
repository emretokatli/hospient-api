'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('offers', {
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
      type: {
        type: Sequelize.ENUM('spa', 'restaurant', 'pool', 'activity', 'room', 'other'),
        allowNull: false
      },
      discount_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        validate: {
          min: 0,
          max: 100
        }
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        validate: {
          min: 0
        }
      },
      original_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      discounted_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      valid_from: {
        type: Sequelize.DATE,
        allowNull: false
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      terms_conditions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      max_uses: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      current_uses: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      applicable_for: {
        type: Sequelize.ENUM('guests', 'walkin', 'both'),
        defaultValue: 'both'
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0
        }
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
    await queryInterface.addIndex('offers', ['hotel_id']);
    await queryInterface.addIndex('offers', ['type']);
    await queryInterface.addIndex('offers', ['is_active']);
    await queryInterface.addIndex('offers', ['valid_from', 'valid_until']);
    await queryInterface.addIndex('offers', ['applicable_for']);
    await queryInterface.addIndex('offers', ['priority']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('offers');
  }
}; 