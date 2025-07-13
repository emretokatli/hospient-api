'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create integrations table
    await queryInterface.createTable('integrations', {
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
      integration_type: {
        type: Sequelize.ENUM('pos', 'pms', 'guest_management'),
        allowNull: false
      },
      provider_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      provider_version: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'error', 'testing'),
        defaultValue: 'inactive'
      },
      config: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Integration configuration (API endpoints, credentials, etc.)'
      },
      credentials: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Encrypted credentials and API keys'
      },
      webhook_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Webhook URL for receiving updates from 3rd party'
      },
      webhook_secret: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Secret for webhook signature validation'
      },
      sync_settings: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Data synchronization settings and schedules'
      },
      last_sync: {
        type: Sequelize.DATE,
        allowNull: true
      },
      sync_status: {
        type: Sequelize.ENUM('success', 'failed', 'in_progress'),
        allowNull: true
      },
      error_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for integrations table
    await queryInterface.addIndex('integrations', ['hotel_id', 'integration_type']);
    await queryInterface.addIndex('integrations', ['status']);
    await queryInterface.addIndex('integrations', ['provider_name']);

    // Create integration_logs table
    await queryInterface.createTable('integration_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      integration_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'integrations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      operation_type: {
        type: Sequelize.ENUM('sync', 'webhook', 'api_call', 'error', 'test'),
        allowNull: false
      },
      operation_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Specific operation name (e.g., "sync_menus", "post_check")'
      },
      direction: {
        type: Sequelize.ENUM('inbound', 'outbound', 'bidirectional'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('success', 'failed', 'partial', 'pending'),
        allowNull: false
      },
      request_data: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Request payload sent to 3rd party'
      },
      response_data: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Response received from 3rd party'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      error_code: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      processing_time: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Processing time in milliseconds'
      },
      records_processed: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of records processed in this operation'
      },
      records_success: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of records successfully processed'
      },
      records_failed: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Number of records that failed processing'
      },
      metadata: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional metadata about the operation'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes for integration_logs table
    await queryInterface.addIndex('integration_logs', ['integration_id', 'created_at']);
    await queryInterface.addIndex('integration_logs', ['operation_type', 'status']);
    await queryInterface.addIndex('integration_logs', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop integration_logs table first (due to foreign key constraint)
    await queryInterface.dropTable('integration_logs');
    
    // Drop integrations table
    await queryInterface.dropTable('integrations');
  }
}; 