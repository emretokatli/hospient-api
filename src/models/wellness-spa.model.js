const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const WellnessSpa = sequelize.define('WellnessSpa', {
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
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'e.g., "spa", "wellness_center", "fitness_center", "massage_therapy", "package"'
    },
    features: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string of features or comma-separated list'
    },
    working_hours: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string with days of week and open/close times',
      get() {
        const rawValue = this.getDataValue('working_hours');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('working_hours', value ? JSON.stringify(value) : null);
      }
    },
    images: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string array of image objects with url and index',
      get() {
        const rawValue = this.getDataValue('images');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('images', value ? JSON.stringify(value) : null);
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'wellness_spa',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return WellnessSpa;
};
