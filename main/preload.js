const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wikiAPI', {
  // Database Connection
  getDbStatus: () => ipcRenderer.invoke('get-db-status'),
  getDbConfig: () => ipcRenderer.invoke('get-db-config'),
  updateDbConfig: (config) => ipcRenderer.invoke('update-db-config', config),
  testDbConnection: (uri) => ipcRenderer.invoke('test-db-connection', uri),
  reconnectDb: () => ipcRenderer.invoke('reconnect-db'),
  initializeDatabase: () => ipcRenderer.invoke('initialize-database'),
  // Entry operations
  saveEntry: (data) => ipcRenderer.invoke('save-wiki-entry', data),
  getEntries: () => ipcRenderer.invoke('get-wiki-entries'),
  getEntryByTitle: (title) => ipcRenderer.invoke('get-entry-by-title', title),
  getAllTags: () => ipcRenderer.invoke('get-all-tags'),
  getEntryTags: (entryId) => ipcRenderer.invoke('get-entry-tags', entryId),
  searchEntries: (query) => ipcRenderer.invoke('search-entries', query),
  askGemini: (query, context) => ipcRenderer.invoke('ask-gemini', { query, context }),
  publishEntry: (id) => ipcRenderer.invoke('publish-to-ipfs', id),
  verifyIntegrity: () => ipcRenderer.invoke('verify-integrity'),
  connectSwarm: (multiaddr) => ipcRenderer.invoke('connect-swarm', multiaddr),
  captureWebSnapshot: (url) => ipcRenderer.invoke('capture-web-snapshot', url),
  getPeerId: () => ipcRenderer.invoke('get-peer-id'),
  createPrivateSwarm: () => ipcRenderer.invoke('create-private-swarm'),
  login: (creds) => ipcRenderer.invoke('login', creds),
  logout: () => ipcRenderer.invoke('logout'),
  // User Management
  getUsers: () => ipcRenderer.invoke('get-users'),
  createUser: (data) => ipcRenderer.invoke('create-user', data),
  deleteUser: (username) => ipcRenderer.invoke('delete-user', username),
  updateUserRole: (data) => ipcRenderer.invoke('update-user-role', data),
  toggleUserActive: (username) => ipcRenderer.invoke('toggle-user-active', username),
  resetUserPassword: (data) => ipcRenderer.invoke('reset-user-password', data),
  changeOwnPassword: (data) => ipcRenderer.invoke('change-own-password', data),
  changeOwnUsername: (data) => ipcRenderer.invoke('change-own-username', data),
  updateProfileImage: (data) => ipcRenderer.invoke('update-profile-image', data),
  getProfileImage: (username) => ipcRenderer.invoke('get-profile-image', username),
  // Database Export/Import/Backup
  exportDatabase: () => ipcRenderer.invoke('export-database'),
  importDatabase: () => ipcRenderer.invoke('import-database'),
  backupNow: () => ipcRenderer.invoke('backup-now'),
  getBackupStats: () => ipcRenderer.invoke('get-backup-stats'),
  deleteBackup: (filename) => ipcRenderer.invoke('delete-backup', filename),
  updateBackupSchedule: (schedule) => ipcRenderer.invoke('update-backup-schedule', schedule),
  getBackupSchedule: () => ipcRenderer.invoke('get-backup-schedule'),
  // Entry Edit/Delete Operations
  updateEntry: (data) => ipcRenderer.invoke('update-wiki-entry', data),
  deleteEntry: (entryId) => ipcRenderer.invoke('delete-wiki-entry', entryId),
  restoreEntry: (entryId) => ipcRenderer.invoke('restore-wiki-entry', entryId),
  // File Selection
  selectFiles: () => ipcRenderer.invoke('select-files'),
  // Multiple Assets Management
  addEntryAssets: (data) => ipcRenderer.invoke('add-entry-assets', data),
  getEntryAssets: (entryId) => ipcRenderer.invoke('get-entry-assets', entryId),
  updateAssetCaption: (data) => ipcRenderer.invoke('update-asset-caption', data),
  // Infobox
  getEntryInfobox: (entryId) => ipcRenderer.invoke('get-entry-infobox', entryId),
  // Search Autocomplete
  searchAutocomplete: (query) => ipcRenderer.invoke('search-autocomplete', query),
  // Activity Logs (Admin only)
  getActivityLogs: (options) => ipcRenderer.invoke('get-activity-logs', options),
  getLogStats: () => ipcRenderer.invoke('get-log-stats'),
  // Keyword Management
  renameKeyword: (data) => ipcRenderer.invoke('rename-keyword', data),
  deleteKeyword: (keywordId) => ipcRenderer.invoke('delete-keyword', keywordId),
  getEntriesByKeyword: (keywordId) => ipcRenderer.invoke('get-entries-by-keyword', keywordId),
  // User Preferences
  getUserPreferences: (username) => ipcRenderer.invoke('get-user-preferences', username),
  updateUserPreferences: (data) => ipcRenderer.invoke('update-user-preferences', data),
  resetUserPreferences: (username) => ipcRenderer.invoke('reset-user-preferences', username),
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
});
