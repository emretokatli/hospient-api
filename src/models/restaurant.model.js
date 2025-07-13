const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Restaurant = sequelize.define('Restaurant', {
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
    service_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    working_hours: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const value = this.getDataValue('working_hours');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('working_hours', JSON.stringify(value));
      }
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    }
  }, {
    tableName: 'restaurants',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Restaurant;
}; 