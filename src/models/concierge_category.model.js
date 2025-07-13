// src/models/concierge_category.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConciergeCategory = sequelize.define('ConciergeCategory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'concierge_categories', key: 'id' },
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
  }, {
    tableName: 'concierge_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  // self‑reference for tree structure
  ConciergeCategory.hasMany(ConciergeCategory, {
    as: 'subCategories',
    foreignKey: 'parent_id',
  });
  ConciergeCategory.belongsTo(ConciergeCategory, {
    as: 'parent',
    foreignKey: 'parent_id',
  });

  return ConciergeCategory;
};
