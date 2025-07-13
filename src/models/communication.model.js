const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Communication = sequelize.define('Communication', {
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
    type: {
      type: DataTypes.ENUM('feedback', 'chat', 'notification', 'push_notification'),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('general', 'service', 'room', 'restaurant', 'spa', 'activity', 'emergency', 'promotion'),
      allowNull: false,
      defaultValue: 'general'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    sender_type: {
      type: DataTypes.ENUM('hotel', 'guest', 'staff'),
      allowNull: false
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the sender (guest_id, staff_id, or null for hotel)'
    },
    sender_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    recipient_type: {
      type: DataTypes.ENUM('guest', 'walkin', 'all', 'specific'),
      allowNull: false,
      defaultValue: 'all'
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Specific recipient ID if recipient_type is specific'
    },
    recipient_device_token: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Device token for push notifications'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal'
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'delivered', 'read', 'failed'),
      defaultValue: 'draft'
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'For scheduled notifications'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Expiration time for notifications'
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional data like images, links, actions, etc. (JSON string)'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'For feedback type communications'
    },
    response_to_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'communications',
        key: 'id'
      },
      comment: 'For chat replies'
    },
    is_anonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'For anonymous feedback'
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Tags for categorizing communications (JSON string)'
    },
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'en',
      comment: 'Language of the communication'
    }
  }, {
    tableName: 'communications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['hotel_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['category']
      },
      {
        fields: ['sender_type']
      },
      {
        fields: ['recipient_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['scheduled_at']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['response_to_id']
      }
    ]
  });

  return Communication;
}; 