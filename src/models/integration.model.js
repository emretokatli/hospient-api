const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Integration = sequelize.define('Integration', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'hotels',
        key: 'id'
      }
    },
    integration_type: {
      type: DataTypes.ENUM('pos', 'pms', 'guest_management'),
      allowNull: false
    },
    provider: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Specific provider name (e.g., Simphony Cloud, Opera Cloud)'
    },
    provider_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    provider_version: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'error', 'testing'),
      defaultValue: 'inactive'
    },
    config: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Integration configuration (API endpoints, credentials, etc.)',
      get() {
        const rawValue = this.getDataValue('config');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('config', value ? JSON.stringify(value) : null);
      }
    },
    credentials: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Encrypted credentials and API keys',
      get() {
        const rawValue = this.getDataValue('credentials');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('credentials', value ? JSON.stringify(value) : null);
      }
    },
    webhook_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Webhook URL for receiving updates from 3rd party'
    },
    webhook_secret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Secret for webhook signature validation'
    },
    sync_settings: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Data synchronization settings and schedules',
      get() {
        const rawValue = this.getDataValue('sync_settings');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('sync_settings', value ? JSON.stringify(value) : null);
      }
    },
    last_sync: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sync_status: {
      type: DataTypes.ENUM('success', 'failed', 'in_progress'),
      allowNull: true
    },
    error_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_error: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'members',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'members',
        key: 'id'
      }
    }
  }, {
    tableName: 'integrations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['hotel_id', 'integration_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['provider']
      },
      {
        fields: ['provider_name']
      }
    ]
  });

  return Integration;
}; 