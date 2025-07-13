const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Meeting = sequelize.define('Meeting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    event_type: {
      type: DataTypes.ENUM('meeting', 'conference', 'wedding', 'birthday', 'corporate_event', 'other'),
      allowNull: false,
      defaultValue: 'meeting'
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Maximum number of attendees'
    },
    current_attendees: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Meeting room or venue location'
    },
    organizer_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    organizer_email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    organizer_phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'confirmed', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft'
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this event is visible to public/guests'
    },
    requires_approval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this event requires hotel approval'
    },
    special_requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Special requirements or notes'
    },
    catering_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    equipment_required: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Required equipment (JSON string)'
    },
    budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Event budget'
    },
    deposit_paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deposit_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    total_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Internal notes for hotel staff'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the member who created this meeting'
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID of the member who approved this meeting'
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'meetings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['hotel_id']
      },
      {
        fields: ['event_type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['start_date']
      },
      {
        fields: ['end_date']
      },
      {
        fields: ['is_public']
      },
      {
        fields: ['organizer_email']
      },
      {
        fields: ['created_by']
      }
    ]
  });

  return Meeting;
};
