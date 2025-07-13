const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Hotel = sequelize.define('Hotel', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    organization_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    web_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    social_media_links: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    banner_url: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    has_fb: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_spa: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isMultiImages: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    specials: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    hotel_slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
  }, {
    tableName: 'hotels',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Hotel;
}; 