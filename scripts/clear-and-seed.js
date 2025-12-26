/**
 * Script to clear all documents and re-ingest seed data
 * Usage: node scripts/clear-and-seed.js
 */

// Enable test mode to use temp directory instead of production database
// Comment this line to clear production database (USE WITH CAUTION!)
process.env.TEST_MODE = 'true';

const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🗑️  Clear and Re-seed Script');
console.log('============================\n');

// Determine database path
let userDataPath;
if (process.env.TEST_MODE === 'true') {
    userDataPath = path.join(os.tmpdir(), 'ecop-wiki-test');
    console.log('⚠️  Running in TEST MODE');
    console.log(`📁 Using test database at: ${userDataPath}\n`);
} else {
    try {
        const electron = require('electron');
        if (electron.app) {
            userDataPath = electron.app.getPath('userData');
        }
    } catch (e) {
        console.error('❌ Error: Cannot determine production database path without Electron.');
        console.error('   This script must be run in TEST_MODE when outside Electron.');
        process.exit(1);
    }
    console.log('⚠️  PRODUCTION MODE - This will clear your REAL database!');
    console.log(`📁 Using production database at: ${userDataPath}\n`);
}

const vaultDir = path.join(userDataPath, 'vault');
const dbPath = path.join(vaultDir, 'vault.db');

if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database not found at: ${dbPath}`);
    console.error('   Please run the application first to initialize the database.');
    process.exit(1);
}

console.log(`📊 Database found at: ${dbPath}`);

try {
    const db = new Database(dbPath);

    // Get count before clearing
    const beforeCount = db.prepare('SELECT COUNT(*) as count FROM research_entries').get();
    console.log(`\n🗑️  Clearing ${beforeCount.count} existing research entries...`);

    // Clear all research entries (will cascade delete entry_tags)
    const deleteResult = db.prepare('DELETE FROM research_entries').run();
    console.log(`   ✅ Deleted ${deleteResult.changes} research entries`);

    // Clear all tags
    const deleteTagsResult = db.prepare('DELETE FROM tags').run();
    console.log(`   ✅ Deleted ${deleteTagsResult.changes} tags`);

    // Clear FTS index
    db.prepare('DELETE FROM research_fts').run();
    console.log('   ✅ Cleared full-text search index');

    console.log('\n🌱 Re-seeding database with WW2 sample data...');

    // Now import and re-initialize dbManager to trigger seed
    delete require.cache[require.resolve('../main/db/dbManager')];
    const dbManager = require('../main/db/dbManager');
    dbManager.initDB();

    // Verify seed
    const afterCount = db.prepare('SELECT COUNT(*) as count FROM research_entries').get();
    const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get();

    console.log('\n✅ Database cleared and re-seeded successfully!');
    console.log('\n📊 Final Statistics:');
    console.log(`   - Research entries: ${afterCount.count}`);
    console.log(`   - Tags: ${tagCount.count}`);
    console.log('\n📚 Seed data includes:');
    console.log('   - 9 WW2 knowledge entries (Operation Overlord, D-Day, etc.)');
    console.log('   - Default user accounts:');
    console.log('     • admin / admin123');
    console.log('     • editor / editor123');
    console.log('     • reader / reader123');

    db.close();

} catch (error) {
    console.error('\n❌ Error during clear and seed:', error);
    process.exit(1);
}
