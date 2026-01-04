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

// Import services
const { userService, entryService, tagService, activityLogService, userPreferencesService, integrityService, assetService } = require('../services');

// Import repositories
const tagRepository = require('../repositories/tagRepository');
const userRepository = require('../repositories/userRepository');

// Re-export paths
const { assetDir, userDataPath } = mongoConnection;

/**
 * Initialize database connection
 */
const initDB = async () => {
  const connectionResult = await mongoConnection.connect();
  if (!connectionResult.success) {
    console.error('Failed to connect to MongoDB:', connectionResult.message);
    return connectionResult;
  }
  return { success: true };
};

/**
 * Initialize database with collections and master admin user
 * Creates necessary collections and default master admin if not exists
 */
const initializeDatabase = async () => {
  try {
    // Check if master admin already exists
    const masterExists = await userRepository.exists('master');

    if (!masterExists) {
      // Create master admin user
      const result = await userService.createUser('master', 'master123', 'admin');
      if (result.success) {
        console.log('Master Admin Account Created: master / master123');
        return {
          success: true,
          message: 'Database initialized. Master admin created (master / master123)',
          created: true
        };
      } else {
        return { success: false, message: 'Failed to create master admin: ' + result.message };
      }
    }

    return {
      success: true,
      message: 'Database already initialized. Master admin exists.',
      created: false
    };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { success: false, message: error.message };
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
  initializeDatabase,

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
