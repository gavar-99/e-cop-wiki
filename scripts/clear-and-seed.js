/**
 * Script to clear all documents and re-ingest seed data (MongoDB version)
 * Usage: node scripts/clear-and-seed.js
 */

process.env.TEST_MODE = 'true';

const mongoose = require('mongoose');
const path = require('path');
const os = require('os');

console.log('Clear and Re-seed Script (MongoDB)');
console.log('===================================\n');

// MongoDB connection URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecop-wiki';

console.log(`Connecting to MongoDB: ${MONGO_URI}\n`);

async function clearAndSeed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Import models after connection
    const { User, Tag, Entry, ActivityLog } = require('../main/db/models');

    // Get counts before clearing
    const beforeEntries = await Entry.countDocuments();
    const beforeTags = await Tag.countDocuments();
    const beforeUsers = await User.countDocuments();

    console.log(`Clearing ${beforeEntries} entries, ${beforeTags} tags, ${beforeUsers} users...`);

    // Clear all collections
    await Entry.deleteMany({});
    console.log('   Deleted all entries');

    await Tag.deleteMany({});
    console.log('   Deleted all tags');

    await User.deleteMany({});
    console.log('   Deleted all users');

    await ActivityLog.deleteMany({});
    console.log('   Deleted all activity logs');

    console.log('\nRe-seeding database with sample data...\n');

    // Import dbManager to trigger seed
    delete require.cache[require.resolve('../main/db/dbManager')];
    const dbManager = require('../main/db/dbManager');
    await dbManager.initDB();

    // Verify seed
    const afterEntries = await Entry.countDocuments();
    const afterTags = await Tag.countDocuments();
    const afterUsers = await User.countDocuments();

    console.log('\nDatabase cleared and re-seeded successfully!');
    console.log('\nFinal Statistics:');
    console.log(`   - Research entries: ${afterEntries}`);
    console.log(`   - Tags: ${afterTags}`);
    console.log(`   - Users: ${afterUsers}`);
    console.log('\nSeed data includes:');
    console.log('   - 5 WW2 knowledge entries (Operation Overlord, D-Day, etc.)');
    console.log('   - Default user accounts:');
    console.log('     admin / admin123');
    console.log('     editor / editor123');
    console.log('     reader / reader123');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\nError during clear and seed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

clearAndSeed();
