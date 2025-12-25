const { app, BrowserWindow, ipcMain, protocol, net, Menu } = require('electron');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const { initDB, db, saveAssetWithHash, verifyIntegrity, assetDir, verifyUser, setEntryTags, getEntryTags, getAllTags, searchEntries, createUser, getAllUsers, deleteUser, updateUserRole, toggleUserActive } = require('./db/dbManager');
const ipfsSidecar = require('./ipfs/sidecar');
const { publishToSwarm, connectToPeer, getPeerId, createPrivateSwarm } = require('./ipfs/ipfsHandler');
const { askGeminiWithContext } = require('./api/gemini');

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
        return { success: true, user: activeSession };
    }
    return result;
});

ipcMain.handle('logout', async () => {
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
ipcMain.handle('save-wiki-entry', async (event, { title, content, filePath, tags = [] }) => {
  if (!activeSession || !['admin', 'editor'].includes(activeSession.role)) {
      return { success: false, message: 'Permission Denied' };
  }
  try {
    let assetName = null;
    let assetHash = 'no-asset';

    if (filePath) {
      const { hash, fileName } = saveAssetWithHash(filePath);
      assetName = fileName;
      assetHash = hash;
    }

    // UPDATED MASTER FINGERPRINT: Hashing Title + Content + Tags + Asset Hash
    // This creates an unbreakable link between the text, keywords, and the evidence.
    const sortedTags = tags.slice().sort();
    const tagsString = sortedTags.join(',');

    const masterHash = crypto
      .createHash('sha256')
      .update(`${title}|${content}|${tagsString}|${assetHash}`)
      .digest('hex');

    const insert = db.prepare(`
            INSERT INTO research_entries (title, content, asset_path, sha256_hash)
            VALUES (?, ?, ?, ?)
        `);
    const result = insert.run(title, content, assetName, masterHash);
    const entryId = result.lastInsertRowid;

    // Associate tags with the entry
    setEntryTags(entryId, tags);

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
  const entries = db.prepare('SELECT * FROM research_entries ORDER BY timestamp DESC').all();

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
  const entryIds = searchEntries(query);
  if (entryIds.length === 0) return [];

  const placeholders = entryIds.map(() => '?').join(',');
  const entries = db.prepare(`
    SELECT * FROM research_entries
    WHERE id IN (${placeholders})
    ORDER BY timestamp DESC
  `).all(...entryIds);

  // Attach tags to search results
  return entries.map(entry => ({
    ...entry,
    tags: getEntryTags(entry.id).map(t => t.name)
  }));
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
  return createUser(username, password, role);
});

ipcMain.handle('delete-user', async (event, username) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  if (username === activeSession.username) {
    return { success: false, message: 'Cannot delete your own account' };
  }
  return deleteUser(username);
});

ipcMain.handle('update-user-role', async (event, { username, role }) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  return updateUserRole(username, role);
});

ipcMain.handle('toggle-user-active', async (event, username) => {
  if (!activeSession || activeSession.role !== 'admin') {
    return { success: false, message: 'Admin access required' };
  }
  if (username === activeSession.username) {
    return { success: false, message: 'Cannot deactivate your own account' };
  }
  return toggleUserActive(username);
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
