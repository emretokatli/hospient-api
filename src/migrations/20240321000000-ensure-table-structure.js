'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Ensure organizations table has all required columns
    await queryInterface.addColumn('organizations', 'isMultiProperty', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }).catch(() => {
      // Column might already exist, ignore error
    });

    // Ensure hotels table has all required columns
    await queryInterface.addColumn('hotels', 'hotel_slug', {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true
    }).catch(() => {
      // Column might already exist, ignore error
    });

    // Add any other missing columns here
  },
}; 