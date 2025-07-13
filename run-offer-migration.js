const { sequelize } = require('./src/models');

async function runMigration() {
  try {
    console.log('Running offers table migration...');
    
    // Import and run the migration
    const migration = require('./src/migrations/20240323000000-create-offers-table.js');
    
    // Get the queryInterface from sequelize
    const queryInterface = sequelize.getQueryInterface();
    
    // Run the migration
    await migration.up(queryInterface, sequelize.Sequelize);
    
    console.log('✅ Offers table migration completed successfully!');
    console.log('The offers table has been created with all necessary fields and indexes.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

runMigration(); 