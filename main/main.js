const { app, BrowserWindow, ipcMain, protocol, net } = require('electron');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const { initDB, db, saveAssetWithHash, verifyIntegrity, assetDir, verifyUser } = require('./db/dbManager');
const ipfsSidecar = require('./ipfs/sidecar');
const { publishToSwarm, connectToPeer, getPeerId, createPrivateSwarm } = require('./ipfs/ipfsHandler');
const { askGeminiWithContext } = require('./api/gemini');

// Security Session State
let activeSession = null;

// Register custom protocol for secure image loading
protocol.registerSchemesAsPrivileged([
  { scheme: 'wiki-asset', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);



function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../assets/images/logo.png'),
    autoHideMenuBar: true,
    frame: false, // Frameless for custom title bar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  
  win.removeMenu();

  // Use path.join to ensure Windows compatibility
  // Load the built application from 'dist'
  win.loadFile(path.join(__dirname, '../dist/index.html'));
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
ipcMain.handle('save-wiki-entry', async (event, { title, content, filePath }) => {
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

    // MASTER FINGERPRINT: Hashing Title + Content + Asset Hash
    // This creates an unbreakable link between the text and the evidence.
    const masterHash = crypto
      .createHash('sha256')
      .update(`${title}|${content}|${assetHash}`)
      .digest('hex');

    const insert = db.prepare(`
            INSERT INTO research_entries (title, content, asset_path, sha256_hash)
            VALUES (?, ?, ?, ?)
        `);
    insert.run(title, content, assetName, masterHash);
    return { success: true };
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
  return db.prepare('SELECT * FROM research_entries ORDER BY timestamp DESC').all();
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
