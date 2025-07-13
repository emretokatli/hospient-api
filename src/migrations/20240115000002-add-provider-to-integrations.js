'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('integrations', 'provider', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'Unknown',
      comment: 'Specific provider name (e.g., Simphony Cloud, Opera Cloud)'
    });

    // Add index for provider field
    await queryInterface.addIndex('integrations', ['provider'], {
      name: 'integrations_provider_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('integrations', 'integrations_provider_idx');
    await queryInterface.removeColumn('integrations', 'provider');
  }
}; 