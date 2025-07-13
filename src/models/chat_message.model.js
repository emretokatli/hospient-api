const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ChatMessage = sequelize.define('ChatMessage', {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      hotel_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      hotel_slug: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      room: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      user: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
    return ChatMessage;
  };