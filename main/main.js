const { app, BrowserWindow, ipcMain, protocol, net, Menu, dialog } = require('electron');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const {
  initDB,
  connect,
  disconnect,
  getConnectionStatus,
  getConnectionConfig,
  updateConnectionConfig,
  testConnection,
  saveAssetWithHash,
  verifyIntegrity,
  assetDir,
  verifyUser,
  setEntryTags,
  getEntryTags,
  getAllTags,
  renameKeyword,
  deleteKeyword,
  getEntriesByKeyword,
  getUserPreferences,
  updateUserPreferences,
  resetUserPreferences,
  searchEntries,
  searchAutocomplete,
  createUser,
  getAllUsers,
  deleteUser,
  updateUserRole,
  toggleUserActive,
  resetUserPassword,
  changeOwnPassword,
  changeOwnUsername,
  getEntries,
  getEntryById,
  createEntry,
  updateEntry,
  deleteEntry,
  restoreEntry,
  addEntryAssets,
  getEntryAssets,
  updateAssetCaption,
  getEntryInfobox,
  logActivity,
  getActivityLogs,
  getLogStats
} = require('./db/dbManager');
const ipfsSidecar = require('./ipfs/sidecar');
const { publishToSwarm, connectToPeer, getPeerId, createPrivateSwarm } = require('./ipfs/ipfsHandler');
const { askGeminiWithContext } = require('./api/gemini');
const { exportDatabase, importDatabase, createAutoBackup, getBackupStats, deleteBackup } = require('./db/backupManager');
const backupScheduler = require('./backupScheduler');

// Security Session State
let activeSession = null;
let mainWindow = null;

// Register custom protocol for secure image loading
protocol.registerSchemesAsPrivileged([
  { scheme: 'wiki-asset', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

// Create Application Menu (minimal - only development tools)
function createMenu() {
  const template = [
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../assets/images/logo.png'),
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  createMenu();
}

app.whenReady().then(async () => {
  // Initialize MongoDB connection
  const dbResult = await initDB();
  if (!dbResult.success) {
    console.error('Failed to initialize database:', dbResult.message);
  }

  ipfsSidecar.start();

  // Start backup scheduler
  backupScheduler.startScheduler();

  // Handle the custom protocol
  protocol.handle('wiki-asset', (request) => {
    const fileName = request.url.replace('wiki-asset://', '');
    const absolutePath = path.join(assetDir, fileName);
    return net.fetch(url.pathToFileURL(absolutePath).toString());
  });

  createWindow();
});

// --- IPC HANDLERS ---

// Window Controls
ipcMain.handle('window-minimize', () => BrowserWindow.getFocusedWindow()?.minimize());
ipcMain.handle('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.handle('window-close', () => BrowserWindow.getFocusedWindow()?.close());

// Database Connection Handlers
ipcMain.handle('get-db-status', async () => {
  return getConnectionStatus();
});

ipcMain.handle('get-db-config', async () => {
  return getConnectionConfig();
});

ipcMain.handle('update-db-config', async (event, config) => {
  return updateConnectionConfig(config);
});

ipcMain.handle('test-db-connection', async (event, uri) => {
  return await testConnection(uri);
});

ipcMain.handle('reconnect-db', async () => {
  return await connect(true);
});

// Authentication
ipcMain.handle('login', async (event, { username, password }) => {
  const result = await verifyUser(username, password);
  if (result.success) {
    activeSession = { username: result.username, role: result.role };
    await logActivity(username, 'login', 'auth', null, null, `User logged in with role: ${result.role}`);
    return { success: true, user: activeSession };
  }
  return result;
});

ipcMain.handle('logout', async () => {
  if (activeSession) {
    await logActivity(activeSession.username, 'logout', 'auth', null, null, 'User logged out');
  }
  activeSession = null;
  return { success: true };
});

ipcMain.handle('verify-integrity', async () => {
  return await verifyIntegrity();
});

ipcMain.handle('connect-swarm', async (event, multiaddr) => {
  return await connectToPeer(multiaddr);
});

ipcMain.handle('capture-web-snapshot', async (event, targetUrl) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
    return { success: false, message: 'Permission Denied' };
  }
  try {
    const win = new BrowserWindow({
      show: false,
      webPreferences: { offscreen: true },
    });
    await win.loadURL(targetUrl);
    const pdfData = await win.webContents.printToPDF({});

    const tempPath = path.join(app.getPath('temp'), `snapshot-${Date.now()}.pdf`);
    require('fs').writeFileSync(tempPath, pdfData);

    return { success: true, filePath: tempPath };
  } catch (error) {
    console.error('Snapshot Error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-peer-id', async () => {
  return await getPeerId();
});

ipcMain.handle('create-private-swarm', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Permission Denied: Admins Only' };
  }
  return await createPrivateSwarm();
});

// Entry Management
ipcMain.handle('save-wiki-entry', async (event, { title, content, filePaths = [], tags = [], infobox = [] }) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
    return { success: false, message: 'Permission Denied' };
  }

  try {
    const assetData = [];
    for (const filePath of filePaths) {
      const { hash, fileName } = saveAssetWithHash(filePath);
      assetData.push({ fileName, hash });
    }

    const result = await createEntry({
      title,
      content,
      tags,
      infobox,
      assets: assetData,
      authorUsername: activeSession.username
    });

    if (result.success) {
      await logActivity(
        activeSession.username,
        'create',
        'entry',
        result.entryId,
        title,
        `Created entry with ${assetData.length} assets and ${infobox.length} infobox fields`
      );
    }

    return result;
  } catch (error) {
    console.error('Storage Error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('publish-to-ipfs', async (event, entryId) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
    return { success: false, message: 'Permission Denied' };
  }

  const entry = await getEntryById(entryId);
  if (!entry) return { success: false, message: 'Entry not found' };

  const result = await publishToSwarm(entry);
  // Note: IPFS CID update would need to be handled in MongoDB
  return result;
});

ipcMain.handle('get-wiki-entries', async () => {
  return await getEntries();
});

ipcMain.handle('get-all-tags', async () => {
  return await getAllTags();
});

ipcMain.handle('get-entry-tags', async (event, entryId) => {
  return await getEntryTags(entryId);
});

// Keyword Management
ipcMain.handle('rename-keyword', async (event, { oldName, newName }) => {
  if (!activeSession) {
    return { success: false, message: 'Not authenticated' };
  }
  return await renameKeyword(oldName, newName);
});

ipcMain.handle('delete-keyword', async (event, keywordId) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return await deleteKeyword(keywordId);
});

ipcMain.handle('get-entries-by-keyword', async (event, keywordId) => {
  return await getEntriesByKeyword(keywordId);
});

// User Preferences
ipcMain.handle('get-user-preferences', async (event, username) => {
  if (!activeSession || activeSession.username !== username) {
    return null;
  }
  return await getUserPreferences(username);
});

ipcMain.handle('update-user-preferences', async (event, { username, preferences }) => {
  if (!activeSession || activeSession.username !== username) {
    return { success: false, message: 'Permission denied' };
  }
  return await updateUserPreferences(username, preferences);
});

ipcMain.handle('reset-user-preferences', async (event, username) => {
  if (!activeSession || activeSession.username !== username) {
    return { success: false, message: 'Permission denied' };
  }
  return await resetUserPreferences(username);
});

ipcMain.handle('search-entries', async (event, query) => {
  return await searchEntries(query);
});

ipcMain.handle('update-wiki-entry', async (event, { entryId, title, content, tags = [], infobox = [], removedAssetIds = [] }) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
    return { success: false, message: 'Permission Denied' };
  }

  try {
    const entry = await getEntryById(entryId);
    if (!entry) {
      return { success: false, message: 'Entry not found' };
    }

    if (activeSession.role === 'editor' && entry.author_username !== activeSession.username) {
      return { success: false, message: 'You can only edit your own entries' };
    }

    const result = await updateEntry({ entryId, title, content, tags, infobox, removedAssetIds });

    if (result.success) {
      await logActivity(
        activeSession.username,
        'edit',
        'entry',
        entryId,
        title,
        `Updated entry: removed ${removedAssetIds.length} assets`
      );
    }

    return result;
  } catch (error) {
    console.error('Update Error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('delete-wiki-entry', async (event, entryId) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
    return { success: false, message: 'Permission Denied' };
  }

  try {
    const entry = await getEntryById(entryId);
    if (!entry) {
      return { success: false, message: 'Entry not found' };
    }

    if (activeSession.role === 'editor' && entry.author_username !== activeSession.username) {
      return { success: false, message: 'You can only delete your own entries' };
    }

    const result = await deleteEntry(entryId, activeSession.username);

    if (result.success) {
      await logActivity(
        activeSession.username,
        'delete',
        'entry',
        entryId,
        entry.title,
        'Soft deleted entry'
      );
    }

    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('restore-wiki-entry', async (event, entryId) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }

  try {
    const result = await restoreEntry(entryId);
    const entry = await getEntryById(entryId);

    if (result.success && entry) {
      await logActivity(
        activeSession.username,
        'restore',
        'entry',
        entryId,
        entry.title,
        'Restored deleted entry'
      );
    }

    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Asset Management
ipcMain.handle('add-entry-assets', async (event, { entryId, filePaths }) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
    return { success: false, message: 'Permission Denied' };
  }

  try {
    const assets = [];
    for (const filePath of filePaths) {
      const { hash, fileName } = saveAssetWithHash(filePath);
      assets.push({ fileName, hash });
    }

    return await addEntryAssets(entryId, assets);
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-entry-assets', async (event, entryId) => {
  return await getEntryAssets(entryId);
});

ipcMain.handle('update-asset-caption', async (event, { assetId, caption }) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
    return { success: false, message: 'Permission Denied' };
  }
  return await updateAssetCaption(assetId, caption);
});

ipcMain.handle('get-entry-infobox', async (event, entryId) => {
  return await getEntryInfobox(entryId);
});

// Search
ipcMain.handle('search-autocomplete', async (event, query) => {
  return await searchAutocomplete(query);
});

// Activity Logs
ipcMain.handle('get-activity-logs', async (event, options) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return await getActivityLogs(options);
});

ipcMain.handle('get-log-stats', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return await getLogStats();
});

// User Management
ipcMain.handle('get-users', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return await getAllUsers();
});

ipcMain.handle('create-user', async (event, { username, password, role }) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  const result = await createUser(username, password, role);
  if (result.success) {
    await logActivity(activeSession.username, 'create', 'user', null, username, `Created user with role: ${role}`);
  }
  return result;
});

ipcMain.handle('delete-user', async (event, username) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  if (username === activeSession.username) {
    return { success: false, message: 'Cannot delete your own account' };
  }
  const result = await deleteUser(username);
  if (result.success) {
    await logActivity(activeSession.username, 'delete', 'user', null, username, 'Deleted user');
  }
  return result;
});

ipcMain.handle('update-user-role', async (event, { username, role }) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  const result = await updateUserRole(username, role);
  if (result.success) {
    await logActivity(activeSession.username, 'edit', 'user', null, username, `Updated role to: ${role}`);
  }
  return result;
});

ipcMain.handle('toggle-user-active', async (event, username) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  if (username === activeSession.username) {
    return { success: false, message: 'Cannot deactivate your own account' };
  }
  const result = await toggleUserActive(username);
  if (result.success) {
    const status = result.active ? 'activated' : 'deactivated';
    await logActivity(activeSession.username, 'edit', 'user', null, username, `User ${status}`);
  }
  return result;
});

// Admin: Reset user password
ipcMain.handle('reset-user-password', async (event, { username, newPassword }) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  const result = await resetUserPassword(username, newPassword);
  if (result.success) {
    await logActivity(activeSession.username, 'edit', 'user', null, username, 'Password reset by admin');
  }
  return result;
});

// User: Change own password
ipcMain.handle('change-own-password', async (event, { currentPassword, newPassword }) => {
  if (!activeSession) {
    return { success: false, message: 'Not authenticated' };
  }
  const result = await changeOwnPassword(activeSession.username, currentPassword, newPassword);
  if (result.success) {
    await logActivity(activeSession.username, 'edit', 'user', null, activeSession.username, 'Changed own password');
  }
  return result;
});

// User: Change own username
ipcMain.handle('change-own-username', async (event, { newUsername, password }) => {
  if (!activeSession) {
    return { success: false, message: 'Not authenticated' };
  }
  const currentUsername = activeSession.username;
  const result = await changeOwnUsername(currentUsername, newUsername, password);
  if (result.success) {
    await logActivity(newUsername, 'edit', 'user', null, newUsername, `Changed username from ${currentUsername}`);
    // Update active session
    activeSession.username = newUsername;
  }
  return result;
});

// Gemini AI
ipcMain.handle('ask-gemini', async (event, { query, context }) => {
  return await askGeminiWithContext(query, context);
});

// Database Export/Import/Backup Handlers
ipcMain.handle('export-database', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }

  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Database',
    defaultPath: `ecop-wiki-backup-${Date.now()}.zip`,
    filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
  });

  if (!filePath) return { success: false, message: 'Export cancelled' };

  return await exportDatabase(filePath);
});

ipcMain.handle('import-database', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }

  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Database',
    filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
    properties: ['openFile']
  });

  if (filePaths.length === 0) return { success: false, message: 'Import cancelled' };

  return await importDatabase(filePaths[0]);
});

ipcMain.handle('backup-now', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return await createAutoBackup();
});

ipcMain.handle('get-backup-stats', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return getBackupStats();
});

ipcMain.handle('delete-backup', async (event, filename) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return deleteBackup(filename);
});

ipcMain.handle('update-backup-schedule', async (event, schedule) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return backupScheduler.updateSchedule(schedule);
});

ipcMain.handle('get-backup-schedule', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return { success: true, schedule: backupScheduler.getSchedule() };
});

app.on('window-all-closed', async () => {
  try {
    ipfsSidecar.stop();
    backupScheduler.stopScheduler();
    await disconnect();
  } catch (e) {
    console.error('Cleanup Error:', e);
  }
  if (process.platform !== 'darwin') app.quit();
});
