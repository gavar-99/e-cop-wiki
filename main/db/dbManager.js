/**
 * Database Manager
 *
 * This module provides a unified interface for database operations.
 * It re-exports functions from services and repositories for backward compatibility.
 *
 * New code should import directly from services/repositories.
 * This file maintains backward compatibility with existing code.
 */
const mongoConnection = require('./mongoConnection');
const { User, Entry } = require('./models');

// Import services
const { userService, entryService, tagService, activityLogService, userPreferencesService, integrityService, assetService } = require('../services');

// Import repositories for seeding
const userRepository = require('../repositories/userRepository');
const entryRepository = require('../repositories/entryRepository');
const tagRepository = require('../repositories/tagRepository');

// Import utils
const { calculateEntryHash } = require('../utils/hashUtils');

// Re-export paths
const { assetDir, userDataPath } = mongoConnection;

/**
 * Initialize database connection and seed data
 */
const initDB = async () => {
  // Connect to MongoDB
  const connectionResult = await mongoConnection.connect();
  if (!connectionResult.success) {
    console.error('Failed to connect to MongoDB:', connectionResult.message);
    return connectionResult;
  }

  // Seed default users
  await seedDefaultUsers();

  // Seed sample research data
  await seedResearch();

  return { success: true };
};

/**
 * Seed default users if they don't exist
 */
const seedDefaultUsers = async () => {
  try {
    // Default Admin
    const adminExists = await userRepository.exists('admin');
    if (!adminExists) {
      await userService.createUser('admin', 'admin123', 'admin');
      console.log('Default Admin Account Created: admin / admin123');
    }

    // Test Editor
    const editorExists = await userRepository.exists('editor');
    if (!editorExists) {
      await userService.createUser('editor', 'editor123', 'editor');
      console.log('Test Editor Account Created: editor / editor123');
    }

    // Test Reader
    const readerExists = await userRepository.exists('reader');
    if (!readerExists) {
      await userService.createUser('reader', 'reader123', 'reader');
      console.log('Test Reader Account Created: reader / reader123');
    }
  } catch (error) {
    console.error('Error seeding users:', error.message);
  }
};

/**
 * Seed sample research data if database is empty
 */
const seedResearch = async () => {
  try {
    const existingEntries = await entryRepository.count();
    if (existingEntries > 0) {
      console.log('Database already seeded, skipping seed data.');
      return;
    }

    console.log('Seeding Extended WW2 Knowledge Graph with Tags...');

    const samples = [
      {
        title: 'Operation Overlord',
        content: 'Operation Overlord was the codename for the [[Battle of Normandy]], the Allied operation that launched the successful invasion of German-occupied Western Europe during World War II. The operation commenced on 6 June 1944 with the [[D-Day]] landings.',
        tags: ['WW2', 'Military Operation', 'Allied Forces', '1944'],
      },
      {
        title: 'Battle of Normandy',
        content: "The Battle of Normandy lasted from June 1944 to August 1944, resulting in the Allied liberation of Western Europe from Nazi Germany's control.",
        tags: ['WW2', 'France', '1944', 'Allied Victory'],
      },
      {
        title: 'D-Day',
        content: "D-Day (June 6, 1944) marked the start of [[Operation Overlord]]. More than 156,000 American, British, and Canadian troops stormed 50 miles of Normandy's fiercely defended beaches.",
        tags: ['WW2', '1944', 'Normandy', 'Invasion'],
      },
      {
        title: 'Dwight D. Eisenhower',
        content: 'General Dwight David "Ike" Eisenhower was the Supreme Commander of the Allied Expeditionary Force in Europe.',
        tags: ['WW2', 'Allied Commander', 'US', 'Biography'],
      },
      {
        title: 'Erwin Rommel',
        content: 'Erwin Rommel, popularly known as the Desert Fox, was a German field marshal of World War II.',
        tags: ['WW2', 'German Commander', 'Biography', 'Atlantic Wall'],
      },
    ];

    for (const sample of samples) {
      // Get or create tags
      const tagIds = [];
      for (const tagName of sample.tags) {
        const tagId = await tagRepository.getOrCreateId(tagName);
        if (tagId) tagIds.push(tagId);
      }

      const masterHash = calculateEntryHash({
        title: sample.title,
        content: sample.content,
        tags: sample.tags,
        assets: [],
        infobox: []
      });

      await Entry.create({
        title: sample.title,
        content: sample.content,
        tags: tagIds,
        sha256Hash: masterHash,
        authorUsername: 'admin',
      });
    }

    console.log('Extended WW2 Knowledge Graph Seeded with Tags.');
  } catch (error) {
    console.error('Error seeding research:', error.message);
  }
};

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// These re-export functions from services for existing code
// New code should import directly from services/repositories
// ============================================================================

module.exports = {
  // Initialization
  initDB,

  // Connection (from mongoConnection)
  connect: mongoConnection.connect,
  disconnect: mongoConnection.disconnect,
  getConnectionStatus: mongoConnection.getStatus,
  getConnectionConfig: mongoConnection.getConfig,
  updateConnectionConfig: mongoConnection.updateConfig,
  testConnection: mongoConnection.testConnection,

  // Paths
  assetDir,
  userDataPath,

  // User management (from userService)
  createUser: userService.createUser,
  verifyUser: userService.verifyUser,
  getAllUsers: userService.getAllUsers,
  deleteUser: userService.deleteUser,
  updateUserRole: userService.updateUserRole,
  toggleUserActive: userService.toggleUserActive,
  resetUserPassword: userService.resetUserPassword,
  changeOwnPassword: userService.changeOwnPassword,
  changeOwnUsername: userService.changeOwnUsername,

  // Asset management (from assetService)
  saveAssetWithHash: assetService.saveAssetWithHash,

  // Tag management (from tagService)
  getOrCreateTag: tagRepository.getOrCreateId,
  setEntryTags: tagService.setEntryTags,
  getEntryTags: tagService.getEntryTags,
  getAllTags: tagService.getAllTags,

  // Keyword management (from tagService)
  renameKeyword: tagService.renameKeyword,
  deleteKeyword: tagService.deleteKeyword,
  getEntriesByKeyword: tagService.getEntriesByKeyword,

  // User preferences (from userPreferencesService)
  getUserPreferences: userPreferencesService.getUserPreferences,
  updateUserPreferences: userPreferencesService.updateUserPreferences,
  resetUserPreferences: userPreferencesService.resetUserPreferences,

  // Entry management (from entryService)
  getEntries: entryService.getEntries,
  getEntryById: entryService.getEntryById,
  createEntry: entryService.createEntry,
  updateEntry: entryService.updateEntry,
  deleteEntry: entryService.deleteEntry,
  restoreEntry: entryService.restoreEntry,

  // Entry assets (from entryService)
  addEntryAssets: entryService.addEntryAssets,
  getEntryAssets: entryService.getEntryAssets,
  updateAssetCaption: entryService.updateAssetCaption,

  // Infobox (from entryService)
  getEntryInfobox: entryService.getEntryInfobox,

  // Search (from entryService)
  searchEntries: entryService.searchEntries,
  searchAutocomplete: entryService.searchAutocomplete,

  // Integrity (from integrityService)
  verifyIntegrity: integrityService.verifyIntegrity,

  // Activity logging (from activityLogService)
  logActivity: activityLogService.logActivity,
  getActivityLogs: activityLogService.getActivityLogs,
  getLogStats: activityLogService.getLogStats,
};
