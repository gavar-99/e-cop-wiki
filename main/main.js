const { app, BrowserWindow, ipcMain, protocol, net } = require('electron');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const { initDB, db, saveAssetWithHash } = require('./db/dbManager');
const ipfs = require('./ipfs/sidecar');
const { askGeminiWithContext } = require('./api/gemini');
const { assetDir } = require('./db/dbManager');

// Register custom protocol for secure image loading
protocol.registerSchemesAsPrivileged([
  { scheme: 'wiki-asset', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  // Use path.join to ensure Windows compatibility
  win.loadFile(path.join(__dirname, '../renderer/public/index.html'));
}

app.whenReady().then(() => {
  initDB();
  ipfs.start();

  // Handle the custom protocol: wiki-asset://[hash].png
  protocol.handle('wiki-asset', (request) => {
    const fileName = request.url.replace('wiki-asset://', '');
    const absolutePath = path.join(assetDir, fileName); // Points to Hardened AppData path
    return net.fetch(url.pathToFileURL(absolutePath).toString());
  });

  createWindow();
});

// --- IPC HANDLERS ---

// Save Entry with Integrity Hashing
ipcMain.handle('save-wiki-entry', async (event, { title, content, filePath }) => {
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
  ipfs.stop();
  if (process.platform !== 'darwin') app.quit();
});
