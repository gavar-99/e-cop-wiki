const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { db, assetDir, vaultDir, userDataPath, verifyIntegrity } = require('./dbManager');

const backupDir = path.join(userDataPath, 'backups');

/**
 * Export database and assets to ZIP file
 * @param {string} destinationPath - Full path to save the ZIP file
 * @returns {Object} Result object with success status
 */
const exportDatabase = async (destinationPath) => {
  try {
    const zip = new AdmZip();

    // Get database path
    const dbPath = path.join(vaultDir, 'vault.db');

    if (!fs.existsSync(dbPath)) {
      return { success: false, message: 'Database file not found' };
    }

    // Add database file
    zip.addLocalFile(dbPath, '', 'vault.db');

    // Add all assets
    if (fs.existsSync(assetDir)) {
      const assetFiles = fs.readdirSync(assetDir);
      assetFiles.forEach(file => {
        const filePath = path.join(assetDir, file);
        if (fs.statSync(filePath).isFile()) {
          zip.addLocalFile(filePath, 'assets', file);
        }
      });
    }

    // Add metadata
    const metadata = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      app: 'E-Cop Wiki',
      entryCount: db.prepare('SELECT COUNT(*) as count FROM research_entries').get().count,
      userCount: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      tagCount: db.prepare('SELECT COUNT(*) as count FROM tags').get().count,
      assetCount: fs.existsSync(assetDir) ? fs.readdirSync(assetDir).length : 0
    };
    zip.addFile('metadata.json', Buffer.from(JSON.stringify(metadata, null, 2)));

    // Write ZIP file
    zip.writeZip(destinationPath);

    return {
      success: true,
      path: destinationPath,
      metadata
    };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Import database from ZIP file
 * @param {string} zipPath - Path to the ZIP file to import
 * @returns {Object} Result object with success status
 */
const importDatabase = async (zipPath) => {
  let tempDir = null;

  try {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    // Validate ZIP structure
    const hasDb = zipEntries.some(e => e.entryName === 'vault.db');
    if (!hasDb) {
      return { success: false, message: 'Invalid backup: vault.db not found' };
    }

    // Extract to temporary location first
    tempDir = path.join(os.tmpdir(), `ecop-restore-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    zip.extractAllTo(tempDir, true);

    // Validate extracted database
    const tempDbPath = path.join(tempDir, 'vault.db');
    if (!fs.existsSync(tempDbPath)) {
      throw new Error('Database extraction failed');
    }

    // Validate it's a valid SQLite database
    try {
      const Database = require('better-sqlite3');
      const testDb = new Database(tempDbPath, { readonly: true });
      testDb.prepare('SELECT COUNT(*) FROM research_entries').get();
      testDb.close();
    } catch (dbError) {
      throw new Error('Invalid database file: ' + dbError.message);
    }

    // Close current database connection
    db.close();

    // Backup current data (safety backup)
    const backupTimestamp = Date.now();
    const currentDbPath = path.join(vaultDir, 'vault.db');
    const currentDbBackup = path.join(vaultDir, `vault.db.backup-${backupTimestamp}`);
    const currentAssetsBackup = path.join(userDataPath, `assets-backup-${backupTimestamp}`);

    if (fs.existsSync(currentDbPath)) {
      fs.copyFileSync(currentDbPath, currentDbBackup);
      console.log(`Current database backed up to: ${currentDbBackup}`);
    }

    if (fs.existsSync(assetDir)) {
      fs.cpSync(assetDir, currentAssetsBackup, { recursive: true });
      console.log(`Current assets backed up to: ${currentAssetsBackup}`);
    }

    // Replace database
    fs.copyFileSync(tempDbPath, currentDbPath);
    console.log('Database replaced successfully');

    // Replace assets
    const tempAssetsDir = path.join(tempDir, 'assets');
    if (fs.existsSync(tempAssetsDir)) {
      // Clear current assets
      if (fs.existsSync(assetDir)) {
        fs.rmSync(assetDir, { recursive: true, force: true });
      }
      fs.mkdirSync(assetDir, { recursive: true });

      // Copy new assets
      fs.cpSync(tempAssetsDir, assetDir, { recursive: true });
      console.log('Assets replaced successfully');
    }

    // Clean up temp files
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    return {
      success: true,
      message: 'Database imported successfully. Please restart the application.',
      requiresRestart: true,
      backupLocation: currentDbBackup
    };
  } catch (error) {
    console.error('Import error:', error);

    // Clean up temp files on error
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    return { success: false, message: error.message };
  }
};

/**
 * Create automatic backup
 * @returns {Object} Result object with success status
 */
const createAutoBackup = async () => {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `auto-backup-${timestamp}.zip`;
    const backupPath = path.join(backupDir, filename);

    const result = await exportDatabase(backupPath);

    if (result.success) {
      console.log(`Auto-backup created: ${filename}`);
      // Clean old backups
      await cleanOldBackups();
      return { success: true, filename, path: backupPath };
    }

    return result;
  } catch (error) {
    console.error('Auto-backup failed:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Clean old automatic backups (keep last N)
 * @param {number} keepCount - Number of backups to keep
 */
const cleanOldBackups = async (keepCount = 10) => {
  try {
    if (!fs.existsSync(backupDir)) {
      return;
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('auto-backup-') && f.endsWith('.zip'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Newest first

    // Delete old backups beyond keepCount
    for (let i = keepCount; i < files.length; i++) {
      fs.unlinkSync(files[i].path);
      console.log(`Deleted old backup: ${files[i].name}`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

/**
 * Get backup statistics
 * @returns {Object} Backup stats
 */
const getBackupStats = () => {
  try {
    if (!fs.existsSync(backupDir)) {
      return { count: 0, totalSize: 0, backups: [] };
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.zip'))
      .map(f => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          size: stats.size,
          date: stats.mtime,
          isAuto: f.startsWith('auto-backup-')
        };
      })
      .sort((a, b) => b.date - a.date); // Newest first

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    return {
      count: files.length,
      totalSize,
      backups: files
    };
  } catch (error) {
    console.error('Error getting backup stats:', error);
    return { count: 0, totalSize: 0, backups: [], error: error.message };
  }
};

/**
 * Delete specific backup
 * @param {string} filename - Backup filename to delete
 * @returns {Object} Result object
 */
const deleteBackup = (filename) => {
  try {
    const filePath = path.join(backupDir, filename);

    // Security: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return { success: false, message: 'Invalid filename' };
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted backup: ${filename}`);
      return { success: true };
    }

    return { success: false, message: 'Backup not found' };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  exportDatabase,
  importDatabase,
  createAutoBackup,
  cleanOldBackups,
  getBackupStats,
  deleteBackup,
  backupDir
};
