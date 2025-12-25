const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// PORTABLE STORAGE LOGIC: Move data out of the AppPath
const userDataPath = app.getPath('userData');
const vaultDir = path.join(userDataPath, 'vault');
const assetDir = path.join(userDataPath, 'assets');

// Ensure directories exist
if (!fs.existsSync(vaultDir)) fs.mkdirSync(vaultDir, { recursive: true });
if (!fs.existsSync(assetDir)) fs.mkdirSync(assetDir, { recursive: true });

const dbPath = path.join(vaultDir, 'vault.db');
const db = new Database(dbPath);

const initDB = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS research_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      asset_path TEXT,
      sha256_hash TEXT UNIQUE,
      ipfs_cid TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const saveAssetWithHash = (sourcePath) => {
  const fileBuffer = fs.readFileSync(sourcePath);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const ext = path.extname(sourcePath);
  const fileName = `${hash}${ext}`;
  const targetPath = path.join(assetDir, fileName);

  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, fileBuffer);
  }
  // Return relative name for DB storage
  return { hash, fileName };
};

module.exports = { initDB, db, saveAssetWithHash, assetDir };
