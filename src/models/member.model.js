const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Member = sequelize.define('Member', {
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
    }
  }, {
    tableName: 'members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (member) => {
        if (member.password_hash) {
          member.password_hash = await bcrypt.hash(member.password_hash, 10);
        }
      },
      beforeUpdate: async (member) => {
        if (member.changed('password_hash')) {
          member.password_hash = await bcrypt.hash(member.password_hash, 10);
        }
      }
    }
  });

  Member.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password_hash);
  };

  return Member;
}; 