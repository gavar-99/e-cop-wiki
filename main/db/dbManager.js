const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Ensure database is in a portable location
const dbPath = path.join(app.getAppPath(), 'main', 'db', 'vault.db');
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

/**
 * Handles asset storage using Content-Addressable logic.
 */
const saveAssetWithHash = (sourcePath) => {
  const fileBuffer = fs.readFileSync(sourcePath);
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const ext = path.extname(sourcePath);
  const targetPath = path.join(app.getAppPath(), 'assets', `${hash}${ext}`);

  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, fileBuffer);
  }
  return { hash, relativePath: `assets/${hash}${ext}` };
};

module.exports = { initDB, db, saveAssetWithHash };
