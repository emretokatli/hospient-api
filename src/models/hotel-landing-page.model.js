const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HotelLandingPage = sequelize.define('HotelLandingPage', {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'inactive'
    },
    images: {
        type: DataTypes.TEXT,
        allowNull: true
    }
  }, {
    tableName: 'hotel_landing_pages',
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

  return HotelLandingPage;
}; 