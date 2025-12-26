const { app, BrowserWindow, ipcMain, protocol, net, Menu, dialog } = require('electron');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const { initDB, db, saveAssetWithHash, verifyIntegrity, assetDir, verifyUser, setEntryTags, getEntryTags, getAllTags, searchEntries, createUser, getAllUsers, deleteUser, updateUserRole, toggleUserActive, calculateAssetsHash, calculateInfoboxHash, recalculateEntryHash, getEntryAssets, getEntryInfobox, logActivity, getActivityLogs, getLogStats } = require('./db/dbManager');
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

// Create Application Menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Verify Database Integrity',
          click: async () => {
            const issues = await verifyIntegrity();
            if (issues && issues.length > 0) {
              console.log(`⚠️ Integrity Issues Found: ${issues.length}`);
            } else {
              console.log('✅ Database integrity verified');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Logout',
          click: () => {
            activeSession = null;
            if (mainWindow) {
              mainWindow.webContents.send('logout-user');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Manage Users',
          click: () => {
            if (mainWindow && activeSession && activeSession.role === 'admin') {
              mainWindow.webContents.send('open-user-management');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            console.log('E-Cop Wiki v1.0.0 - Secure Research Database');
          }
        }
      ]
    },
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
    frame: false, // Frameless for custom title bar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Use path.join to ensure Windows compatibility
  // Load the built application from 'dist'
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  // Create application menu
  createMenu();
}

app.whenReady().then(() => {
  initDB();
  ipfsSidecar.start();

  // Start backup scheduler
  backupScheduler.startScheduler();

  // Handle the custom protocol: wiki-asset://[hash].png
  protocol.handle('wiki-asset', (request) => {
    const fileName = request.url.replace('wiki-asset://', '');
    const absolutePath = path.join(assetDir, fileName); // Points to Hardened AppData path
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

ipcMain.handle('login', async (event, { username, password }) => {
    const result = verifyUser(username, password);
    if (result.success) {
        activeSession = { username: result.username, role: result.role };
        logActivity(username, 'login', 'auth', null, null, `User logged in with role: ${result.role}`);
        return { success: true, user: activeSession };
    }
    return result;
});

ipcMain.handle('logout', async () => {
    if (activeSession) {
        logActivity(activeSession.username, 'logout', 'auth', null, null, 'User logged out');
    }
    activeSession = null;
    return { success: true };
});

ipcMain.handle('verify-integrity', async () => {
  return verifyIntegrity();
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
    
    // Save to temp file
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

// Save Entry with Integrity Hashing
ipcMain.handle('save-wiki-entry', async (event, { title, content, filePaths = [], tags = [], infobox = [] }) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
      return { success: false, message: 'Permission Denied' };
  }
  try {
    // Calculate hashes for all assets
    const assetData = [];

    for (const filePath of filePaths) {
      const { hash, fileName } = saveAssetWithHash(filePath);
      assetData.push({ fileName, hash });
    }

    // Calculate assets chain hash
    const assetsHash = assetData.length > 0
      ? crypto.createHash('sha256').update(assetData.map(a => a.hash).join('|')).digest('hex')
      : 'no-assets';

    // Calculate infobox hash
    const infoboxHash = infobox.length > 0
      ? crypto.createHash('sha256').update(infobox.map(f => `${f.key}:${f.value}`).sort().join('|')).digest('hex')
      : 'no-infobox';

    const sortedTags = tags.slice().sort();
    const tagsString = sortedTags.join(',');

    const masterHash = crypto
      .createHash('sha256')
      .update(`${title}|${content}|${tagsString}|${assetsHash}|${infoboxHash}`)
      .digest('hex');

    // Insert entry with author tracking
    const insert = db.prepare(`
            INSERT INTO research_entries (title, content, sha256_hash, author_username)
            VALUES (?, ?, ?, ?)
        `);
    const result = insert.run(title, content, masterHash, activeSession.username);
    const entryId = result.lastInsertRowid;

    // Insert assets into entry_assets table
    const insertAsset = db.prepare(`
      INSERT INTO entry_assets (entry_id, asset_path, sha256_hash, caption, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    assetData.forEach((asset, idx) => {
      insertAsset.run(entryId, asset.fileName, asset.hash, '', idx);
    });

    // Insert infobox fields
    const insertInfobox = db.prepare(`
      INSERT INTO entry_infoboxes (entry_id, field_key, field_value, display_order)
      VALUES (?, ?, ?, ?)
    `);
    infobox.forEach((field, idx) => {
      if (field.key && field.value) {
        insertInfobox.run(entryId, field.key, field.value, idx);
      }
    });

    // Associate tags with the entry
    setEntryTags(entryId, tags);

    // Log activity
    logActivity(
      activeSession.username,
      'create',
      'entry',
      entryId,
      title,
      `Created entry with ${assetData.length} assets and ${infobox.length} infobox fields`
    );

    return { success: true, entryId };
  } catch (error) {
    console.error('Storage Error:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('publish-to-ipfs', async (event, entryId) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
      return { success: false, message: 'Permission Denied' };
  }
  const entry = db.prepare('SELECT * FROM research_entries WHERE id = ?').get(entryId);
  const result = await publishToSwarm(entry); // Ensure ipfsHandler is imported

  if (result.success) {
    db.prepare('UPDATE research_entries SET ipfs_cid = ? WHERE id = ?').run(result.cid, entryId);
    return { success: true, cid: result.cid };
  }
  return result;
});

// Other handlers remain similar but now interact with the hardened database
ipcMain.handle('get-wiki-entries', async () => {
  // Filter out soft-deleted entries
  const entries = db.prepare('SELECT * FROM research_entries WHERE deleted_at IS NULL ORDER BY timestamp DESC').all();

  // Attach tags to each entry
  return entries.map(entry => ({
    ...entry,
    tags: getEntryTags(entry.id).map(t => t.name)
  }));
});

// Get all tags with usage statistics
ipcMain.handle('get-all-tags', async () => {
  return getAllTags();
});

// Get tags for specific entry
ipcMain.handle('get-entry-tags', async (event, entryId) => {
  return getEntryTags(entryId);
});

// Search entries using FTS5
ipcMain.handle('search-entries', async (event, query) => {
  const entryIds = searchEntries(query); // Already ranked by FTS5
  if (entryIds.length === 0) return [];

  // Create a map for preserving FTS5 rank order
  const orderMap = {};
  entryIds.forEach((id, index) => { orderMap[id] = index; });

  const placeholders = entryIds.map(() => '?').join(',');
  const entries = db.prepare(`
    SELECT * FROM research_entries
    WHERE id IN (${placeholders}) AND deleted_at IS NULL
  `).all(...entryIds);

  // Sort by FTS5 rank order (NOT timestamp) to preserve relevance
  entries.sort((a, b) => orderMap[a.id] - orderMap[b.id]);

  // Attach tags to search results
  return entries.map(entry => ({
    ...entry,
    tags: getEntryTags(entry.id).map(t => t.name)
  }));
});

// Update Entry Handler (Edit)
ipcMain.handle('update-wiki-entry', async (event, { entryId, title, content, tags = [], infobox = [], removedAssetIds = [] }) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
    return { success: false, message: 'Permission Denied' };
  }

  try {
    // Get existing entry to check permissions
    const entry = db.prepare('SELECT * FROM research_entries WHERE id = ?').get(entryId);
    if (!entry) {
      return { success: false, message: 'Entry not found' };
    }

    // Permission check: editors can only edit their own entries
    if (activeSession.role === 'editor' && entry.author_username !== activeSession.username) {
      return { success: false, message: 'You can only edit your own entries' };
    }

    // Update basic fields
    db.prepare('UPDATE research_entries SET title = ?, content = ? WHERE id = ?')
      .run(title, content, entryId);

    // Update tags
    setEntryTags(entryId, tags);

    // Update infobox - delete old and insert new
    db.prepare('DELETE FROM entry_infoboxes WHERE entry_id = ?').run(entryId);
    const insertInfobox = db.prepare(`
      INSERT INTO entry_infoboxes (entry_id, field_key, field_value, display_order)
      VALUES (?, ?, ?, ?)
    `);
    infobox.forEach((field, index) => {
      if (field.key && field.value) {
        insertInfobox.run(entryId, field.key, field.value, index);
      }
    });

    // Remove deleted assets
    if (removedAssetIds.length > 0) {
      const placeholders = removedAssetIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM entry_assets WHERE id IN (${placeholders})`).run(...removedAssetIds);
    }

    // Recalculate integrity hash
    recalculateEntryHash(entryId);

    // Log activity
    logActivity(
      activeSession.username,
      'edit',
      'entry',
      entryId,
      title,
      `Updated entry: removed ${removedAssetIds.length} assets`
    );

    return { success: true };
  } catch (error) {
    console.error('Update Error:', error);
    return { success: false, message: error.message };
  }
});

// Soft Delete Entry Handler
ipcMain.handle('delete-wiki-entry', async (event, entryId) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
    return { success: false, message: 'Permission Denied' };
  }

  try {
    const entry = db.prepare('SELECT * FROM research_entries WHERE id = ?').get(entryId);
    if (!entry) {
      return { success: false, message: 'Entry not found' };
    }

    // Permission check: editors can only delete their own entries
    if (activeSession.role === 'editor' && entry.author_username !== activeSession.username) {
      return { success: false, message: 'You can only delete your own entries' };
    }

    // Soft delete - set timestamp and user
    db.prepare('UPDATE research_entries SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?')
      .run(activeSession.username, entryId);

    // Remove from FTS5 index
    db.prepare('DELETE FROM research_fts WHERE rowid = ?').run(entryId);

    // Log activity
    logActivity(
      activeSession.username,
      'delete',
      'entry',
      entryId,
      entry.title,
      'Soft deleted entry'
    );

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Restore Deleted Entry Handler (Admin only)
ipcMain.handle('restore-wiki-entry', async (event, entryId) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }

  try {
    // Clear soft delete fields
    db.prepare('UPDATE research_entries SET deleted_at = NULL, deleted_by = NULL WHERE id = ?')
      .run(entryId);

    // Re-add to FTS5 index
    const entry = db.prepare('SELECT * FROM research_entries WHERE id = ?').get(entryId);
    const tags = getEntryTags(entryId);
    const tagString = tags.map(t => t.name).join(' ');

    db.prepare('INSERT INTO research_fts(rowid, title, content, tags) VALUES (?, ?, ?, ?)')
      .run(entryId, entry.title, entry.content, tagString);

    // Log activity
    logActivity(
      activeSession.username,
      'restore',
      'entry',
      entryId,
      entry.title,
      'Restored deleted entry'
    );

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Add Assets to Existing Entry
ipcMain.handle('add-entry-assets', async (event, { entryId, filePaths }) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
    return { success: false, message: 'Permission Denied' };
  }

  try {
    const insertAsset = db.prepare(`
      INSERT INTO entry_assets (entry_id, asset_path, sha256_hash, caption, display_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Get current max display order
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM entry_assets WHERE entry_id = ?')
      .get(entryId).count;

    for (let i = 0; i < filePaths.length; i++) {
      const { hash, fileName } = saveAssetWithHash(filePaths[i]);
      insertAsset.run(entryId, fileName, hash, '', currentCount + i);
    }

    // Recalculate integrity hash
    recalculateEntryHash(entryId);

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Get Entry Assets
ipcMain.handle('get-entry-assets', async (event, entryId) => {
  try {
    return getEntryAssets(entryId);
  } catch (error) {
    return [];
  }
});

// Update Asset Caption
ipcMain.handle('update-asset-caption', async (event, { assetId, caption }) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
    return { success: false, message: 'Permission Denied' };
  }

  try {
    db.prepare('UPDATE entry_assets SET caption = ? WHERE id = ?').run(caption, assetId);

    // Get entry ID and recalculate hash
    const asset = db.prepare('SELECT entry_id FROM entry_assets WHERE id = ?').get(assetId);
    if (asset) {
      recalculateEntryHash(asset.entry_id);
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Get Entry Infobox
ipcMain.handle('get-entry-infobox', async (event, entryId) => {
  try {
    return getEntryInfobox(entryId);
  } catch (error) {
    return [];
  }
});

// Search Autocomplete Handler
ipcMain.handle('search-autocomplete', async (event, query) => {
  if (!query || query.trim().length < 2) return [];

  try {
    // Use FTS5 for autocomplete, limit to 8 results
    const entryIds = searchEntries(query);
    if (entryIds.length === 0) return [];

    const placeholders = entryIds.map(() => '?').join(',');
    const results = db.prepare(`
      SELECT id, title FROM research_entries
      WHERE id IN (${placeholders}) AND deleted_at IS NULL
      LIMIT 8
    `).all(...entryIds);

    return results;
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
});

// Activity Logs Handlers (Admin only)
ipcMain.handle('get-activity-logs', async (event, options) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  try {
    return getActivityLogs(options);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
});

ipcMain.handle('get-log-stats', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  try {
    return getLogStats();
  } catch (error) {
    console.error('Error fetching log stats:', error);
    return null;
  }
});

// User Management Handlers (Admin only)
ipcMain.handle('get-users', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return getAllUsers();
});

ipcMain.handle('create-user', async (event, { username, password, role }) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  const result = createUser(username, password, role);
  if (result.success) {
    logActivity(activeSession.username, 'create', 'user', null, username, `Created user with role: ${role}`);
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
  const result = deleteUser(username);
  if (result.success) {
    logActivity(activeSession.username, 'delete', 'user', null, username, 'Deleted user');
  }
  return result;
});

ipcMain.handle('update-user-role', async (event, { username, role }) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  const result = updateUserRole(username, role);
  if (result.success) {
    logActivity(activeSession.username, 'edit', 'user', null, username, `Updated role to: ${role}`);
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
  const result = toggleUserActive(username);
  if (result.success) {
    const status = result.active ? 'activated' : 'deactivated';
    logActivity(activeSession.username, 'edit', 'user', null, username, `User ${status}`);
  }
  return result;
});

// Database Export/Import/Backup Handlers

// Export database
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

// Import database
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

// Create manual backup
ipcMain.handle('backup-now', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return await createAutoBackup();
});

// Get backup statistics
ipcMain.handle('get-backup-stats', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return getBackupStats();
});

// Delete backup
ipcMain.handle('delete-backup', async (event, filename) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return deleteBackup(filename);
});

// Update backup schedule
ipcMain.handle('update-backup-schedule', async (event, schedule) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return backupScheduler.updateSchedule(schedule);
});

// Get backup schedule
ipcMain.handle('get-backup-schedule', async () => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return { success: true, schedule: backupScheduler.getSchedule() };
});

// Gemini AI Call
ipcMain.handle('ask-gemini', async (event, { query, context }) => {
  return await askGeminiWithContext(query, context);
});

app.on('window-all-closed', () => {
  try {
    ipfsSidecar.stop();
  } catch (e) {
    console.error('Cleanup Error:', e);
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  // Stop backup scheduler
  backupScheduler.stopScheduler();
});
