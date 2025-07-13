const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const IntegrationLog = sequelize.define('IntegrationLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    integration_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'integrations',
        key: 'id'
      }
    },
    operation_type: {
      type: DataTypes.ENUM('sync', 'webhook', 'api_call', 'error', 'test'),
      allowNull: false
    },
    operation_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Specific operation name (e.g., "sync_menus", "post_check")'
    },
    direction: {
      type: DataTypes.ENUM('inbound', 'outbound', 'bidirectional'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'partial', 'pending'),
      allowNull: false
    },
    request_data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Request payload sent to 3rd party',
      get() {
        const rawValue = this.getDataValue('request_data');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('request_data', value ? JSON.stringify(value) : null);
      }
    },
    response_data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Response received from 3rd party',
      get() {
        const rawValue = this.getDataValue('response_data');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('response_data', value ? JSON.stringify(value) : null);
      }
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    error_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    processing_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Processing time in milliseconds'
    },
    records_processed: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of records processed in this operation'
    },
    records_success: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of records successfully processed'
    },
    records_failed: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Number of records that failed processing'
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional metadata about the operation',
      get() {
        const rawValue = this.getDataValue('metadata');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('metadata', value ? JSON.stringify(value) : null);
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'integration_logs',
    timestamps: false,
    indexes: [
      {
        fields: ['integration_id', 'created_at']
      },
      {
        fields: ['operation_type', 'status']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return IntegrationLog;
}; 