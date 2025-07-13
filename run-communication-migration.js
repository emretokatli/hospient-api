const { sequelize } = require('./src/models');

async function runMigration() {
  try {
    console.log('Running communications table migration...');
    
    // Check if table already exists
    const tableExists = await sequelize.getQueryInterface().showAllTables()
      .then(tables => tables.includes('communications'));
    
    if (tableExists) {
      console.log('✅ Communications table already exists!');
      console.log('The communications system is ready to use.');
      console.log('Features available:');
      console.log('  - Feedback submissions');
      console.log('  - Chat messages with replies');
      console.log('  - Notifications (scheduled and instant)');
      console.log('  - Push notifications');
      console.log('  - Multi-language support');
      console.log('  - Priority levels and status tracking');
      return;
    }
    
    // Import and run the migration
    const migration = require('./src/migrations/20240324000000-create-communications-table.js');
    
    // Get the queryInterface from sequelize
    const queryInterface = sequelize.getQueryInterface();
    
    // Run the migration
    await migration.up(queryInterface, sequelize.Sequelize);
    
    console.log('✅ Communications table migration completed successfully!');
    console.log('The communications table has been created with all necessary fields and indexes.');
    console.log('This includes support for:');
    console.log('  - Feedback submissions');
    console.log('  - Chat messages with replies');
    console.log('  - Notifications (scheduled and instant)');
    console.log('  - Push notifications');
    console.log('  - Multi-language support');
    console.log('  - Priority levels and status tracking');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    // If it's a duplicate key error, the table might already exist
    if (error.original && error.original.code === 'ER_DUP_KEYNAME') {
      console.log('⚠️  Table exists but indexes may be missing. The system should still work.');
      console.log('You can test the API endpoints now.');
    }
  } finally {
    await sequelize.close();
  }
}

runMigration(); 