/**
 * Electron wrapper to run clear-and-seed script
 * This file will be loaded by Electron's main process
 */

const { app } = require('electron');

// Enable or disable test mode
const USE_TEST_MODE = false; // Set to false for production database

if (USE_TEST_MODE) {
    process.env.TEST_MODE = 'true';
    console.log('Running in TEST MODE');
} else {
    console.log('\n⚠️  Running in PRODUCTION MODE - will clear real database! ⚠️\n');
}

app.whenReady().then(() => {
    const dbManager = require('../main/db/dbManager');
    const { db, initDB } = dbManager;

    try {
        // Ensure database is initialized with all tables
        console.log('Initializing database schema...');
        initDB();

        console.log('\n🗑️  Clearing documents...\n');

        // Get count before clearing
        const beforeCount = db.prepare('SELECT COUNT(*) as count FROM research_entries').get();
        console.log(`Found ${beforeCount.count} existing research entries`);

        // Clear all research entries (cascades to entry_tags)
        const deleteResult = db.prepare('DELETE FROM research_entries').run();
        console.log(`✅ Deleted ${deleteResult.changes} research entries`);

        // Clear all tags
        const deleteTagsResult = db.prepare('DELETE FROM tags').run();
        console.log(`✅ Deleted ${deleteTagsResult.changes} tags`);

        // Clear FTS index
        db.prepare('DELETE FROM research_fts').run();
        console.log('✅ Cleared full-text search index');

        console.log('\n🌱 Re-seeding database with WW2 sample data...\n');

        // Force re-initialization to trigger seed
        delete require.cache[require.resolve('../main/db/dbManager')];
        const freshDbManager = require('../main/db/dbManager');
        freshDbManager.initDB();

        // Verify seed with fresh db reference
        const afterCount = freshDbManager.db.prepare('SELECT COUNT(*) as count FROM research_entries').get();
        const tagCount = freshDbManager.db.prepare('SELECT COUNT(*) as count FROM tags').get();

        console.log('✅ Database cleared and re-seeded successfully!\n');
        console.log('📊 Final Statistics:');
        console.log(`   Research entries: ${afterCount.count}`);
        console.log(`   Tags: ${tagCount.count}`);
        console.log('\n📚 Seed data includes:');
        console.log('   - 9 WW2 knowledge entries');
        console.log('   - Default user accounts (admin/editor/reader)\n');

        setTimeout(() => app.quit(), 100);
    } catch (error) {
        console.error('\n❌ Error:', error);
        setTimeout(() => app.quit(), 100);
    }
});
