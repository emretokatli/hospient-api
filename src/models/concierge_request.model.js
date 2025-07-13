// src/models/concierge_request.model.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConciergeRequest = sequelize.define('ConciergeRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    hotel_id: {                       // <‑‑ link to your Hotel model
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'hotels', key: 'id' },
    },
    guest_id: {                       // could be Member / Booking / Room
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'concierge_categories', key: 'id' },
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    details: {                        // arbitrary JSON payload
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const v = this.getDataValue('details');
        return v ? JSON.parse(v) : null;
      },
      set(v) {
        this.setDataValue('details', JSON.stringify(v));
      },
    },
    status: {                         // requested | in_progress | done | cancelled
      type: DataTypes.ENUM(
        'requested',
        'in_progress',
        'done',
        'cancelled'
      ),
      defaultValue: 'requested',
    },
    scheduled_for: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'concierge_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return ConciergeRequest;
};
