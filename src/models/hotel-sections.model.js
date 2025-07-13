const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HotelSections = sequelize.define('HotelSections', {
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
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
    has_button: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    button_text: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    button_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    images: {
        type: DataTypes.TEXT,
        allowNull: true
    }
  }, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
          fields: ['hotel_id']
        },
        {
          fields: ['title']
        },
        {
          fields: ['slug', 'hotel_id'],
          unique: true,
          name: 'unique_slug_per_hotel'
        }
      ]
  });

  return HotelSections;
}; 