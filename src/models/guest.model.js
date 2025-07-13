const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Guest = sequelize.define('Guest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    nationality: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    passport_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    preferences: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('preferences');
        if (!rawValue) return null;
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return null;
        }
      },
      set(value) {
        if (value === null || value === undefined) {
          this.setDataValue('preferences', null);
        } else {
          this.setDataValue('preferences', JSON.stringify(value));
        }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'guests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (guest) => {
        if (guest.password_hash) {
          guest.password_hash = await bcrypt.hash(guest.password_hash, 10);
        }
      },
      beforeUpdate: async (guest) => {
        if (guest.changed('password_hash')) {
          guest.password_hash = await bcrypt.hash(guest.password_hash, 10);
        }
      }
    }
  });

  Guest.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password_hash);
  };

  return Guest;
}; 