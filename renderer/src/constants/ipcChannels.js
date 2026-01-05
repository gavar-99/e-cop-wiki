// IPC Channel names - mirrors main/preload.js
// This provides type-safety and autocomplete for IPC calls

export const IPC_CHANNELS = {
  // Database Connection
  GET_DB_STATUS: 'get-db-status',
  GET_DB_CONFIG: 'get-db-config',
  UPDATE_DB_CONFIG: 'update-db-config',
  TEST_DB_CONNECTION: 'test-db-connection',
  RECONNECT_DB: 'reconnect-db',
  INITIALIZE_DATABASE: 'initialize-database',

  // Entry Operations
  SAVE_ENTRY: 'save-wiki-entry',
  GET_ENTRIES: 'get-wiki-entries',
  GET_ALL_TAGS: 'get-all-tags',
  GET_ENTRY_TAGS: 'get-entry-tags',
  SEARCH_ENTRIES: 'search-entries',
  SEARCH_AUTOCOMPLETE: 'search-autocomplete',
  UPDATE_ENTRY: 'update-wiki-entry',
  DELETE_ENTRY: 'delete-wiki-entry',
  RESTORE_ENTRY: 'restore-wiki-entry',

  // Assets
  ADD_ENTRY_ASSETS: 'add-entry-assets',
  GET_ENTRY_ASSETS: 'get-entry-assets',
  UPDATE_ASSET_CAPTION: 'update-asset-caption',

  // Infobox
  GET_ENTRY_INFOBOX: 'get-entry-infobox',

  // IPFS & Integrity
  PUBLISH_TO_IPFS: 'publish-to-ipfs',
  VERIFY_INTEGRITY: 'verify-integrity',
  CONNECT_SWARM: 'connect-swarm',
  GET_PEER_ID: 'get-peer-id',
  CREATE_PRIVATE_SWARM: 'create-private-swarm',

  // Web Snapshot
  CAPTURE_WEB_SNAPSHOT: 'capture-web-snapshot',

  // AI
  ASK_GEMINI: 'ask-gemini',

  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',

  // User Management
  GET_USERS: 'get-users',
  CREATE_USER: 'create-user',
  DELETE_USER: 'delete-user',
  UPDATE_USER_ROLE: 'update-user-role',
  TOGGLE_USER_ACTIVE: 'toggle-user-active',
  RESET_USER_PASSWORD: 'reset-user-password',
  CHANGE_OWN_PASSWORD: 'change-own-password',
  CHANGE_OWN_USERNAME: 'change-own-username',
  UPDATE_PROFILE_IMAGE: 'update-profile-image',
  GET_PROFILE_IMAGE: 'get-profile-image',

  // Database Export/Import/Backup
  EXPORT_DATABASE: 'export-database',
  IMPORT_DATABASE: 'import-database',
  BACKUP_NOW: 'backup-now',
  GET_BACKUP_STATS: 'get-backup-stats',
  DELETE_BACKUP: 'delete-backup',
  UPDATE_BACKUP_SCHEDULE: 'update-backup-schedule',
  GET_BACKUP_SCHEDULE: 'get-backup-schedule',

  // Activity Logs
  GET_ACTIVITY_LOGS: 'get-activity-logs',
  GET_LOG_STATS: 'get-log-stats',

  // Keywords
  RENAME_KEYWORD: 'rename-keyword',
  DELETE_KEYWORD: 'delete-keyword',
  GET_ENTRIES_BY_KEYWORD: 'get-entries-by-keyword',

  // User Preferences
  GET_USER_PREFERENCES: 'get-user-preferences',
  UPDATE_USER_PREFERENCES: 'update-user-preferences',
  RESET_USER_PREFERENCES: 'reset-user-preferences',

  // Window Controls
  WINDOW_MINIMIZE: 'window-minimize',
  WINDOW_MAXIMIZE: 'window-maximize',
  WINDOW_CLOSE: 'window-close',
};
