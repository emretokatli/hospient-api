const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Menu = sequelize.define('Menu', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    obj_num: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    item_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    item_description: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    tax_rate: {
      type: DataTypes.DECIMAL(10, 0),
      allowNull: false
    },
    item_price: {
      type: DataTypes.DECIMAL(10, 0),
      allowNull: false
    },
    allergens: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sub_category: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    main_category: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    kcal: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    is_condiment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    hotel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'hotels',
        key: 'id'
      }
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id'
      }
    }
  }, {
    tableName: 'menus',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Menu;
}; 