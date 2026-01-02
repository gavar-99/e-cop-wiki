/**
 * Electron wrapper to run clear-and-seed script (MongoDB version)
 * This file will be loaded by Electron's main process
 */

const { app } = require('electron');

// Enable or disable test mode
const USE_TEST_MODE = false; // Set to false for production database

if (USE_TEST_MODE) {
  process.env.TEST_MODE = 'true';
  console.log('Running in TEST MODE');
} else {
  console.log('\nRunning in PRODUCTION MODE - will clear real database!\n');
}

app.whenReady().then(async () => {
  try {
    const { User, Tag, Entry, ActivityLog } = require('../main/db/models');
    const dbManager = require('../main/db/dbManager');

    // Initialize database connection
    console.log('Connecting to MongoDB...');
    await dbManager.initDB();

    console.log('\nClearing documents...\n');

    // Get count before clearing
    const beforeEntries = await Entry.countDocuments();
    const beforeTags = await Tag.countDocuments();

    console.log(`Found ${beforeEntries} existing research entries`);
    console.log(`Found ${beforeTags} existing tags`);

    // Clear all collections
    await Entry.deleteMany({});
    console.log('Deleted all entries');

    await Tag.deleteMany({});
    console.log('Deleted all tags');

    await User.deleteMany({});
    console.log('Deleted all users');

    await ActivityLog.deleteMany({});
    console.log('Deleted all activity logs');

    console.log('\nRe-seeding database with sample data...\n');

    // Force re-initialization to trigger seed
    delete require.cache[require.resolve('../main/db/dbManager')];
    const freshDbManager = require('../main/db/dbManager');
    await freshDbManager.initDB();

    // Verify seed
    const afterEntries = await Entry.countDocuments();
    const afterTags = await Tag.countDocuments();
    const afterUsers = await User.countDocuments();

    console.log('Database cleared and re-seeded successfully!\n');
    console.log('Final Statistics:');
    console.log(`   Research entries: ${afterEntries}`);
    console.log(`   Tags: ${afterTags}`);
    console.log(`   Users: ${afterUsers}`);
    console.log('\nSeed data includes:');
    console.log('   - 5 WW2 knowledge entries');
    console.log('   - Default user accounts (admin/editor/reader)\n');

    setTimeout(() => app.quit(), 100);
  } catch (error) {
    console.error('\nError:', error);
    setTimeout(() => app.quit(), 100);
  }
});
