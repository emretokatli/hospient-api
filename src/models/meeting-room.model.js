const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MeetingRoom = sequelize.define('MeetingRoom', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'hotels',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    capacity: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Capacity as string (e.g., "10-20 people", "Boardroom style")'
    },
    features: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Features and amenities of the meeting room'
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of image objects with url and index'
    }
  }, {
    tableName: 'meeting_rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['hotel_id']
      },
      {
        fields: ['name']
      }
    ]
  });

  return MeetingRoom;
}; 