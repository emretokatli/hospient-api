const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Images = sequelize.define('Images', {
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
    image_url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    image_type: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    tableName: 'images',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Images;
}; 