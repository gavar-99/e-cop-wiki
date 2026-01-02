const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { User, Tag, Entry, ActivityLog } = require('./models');
const { assetDir, userDataPath } = require('./mongoConnection');

const backupDir = path.join(userDataPath, 'backups');

/**
 * Export database and assets to ZIP file (MongoDB version)
 * Exports all collections as JSON files
 * @param {string} destinationPath - Full path to save the ZIP file
 * @returns {Object} Result object with success status
 */
const exportDatabase = async (destinationPath) => {
  try {
    const zip = new AdmZip();

    // Export all collections as JSON
    const users = await User.find({}).lean();
    const tags = await Tag.find({}).lean();
    const entries = await Entry.find({}).lean();
    const activityLogs = await ActivityLog.find({}).lean();

    // Add collection JSON files
    zip.addFile('users.json', Buffer.from(JSON.stringify(users, null, 2)));
    zip.addFile('tags.json', Buffer.from(JSON.stringify(tags, null, 2)));
    zip.addFile('entries.json', Buffer.from(JSON.stringify(entries, null, 2)));
    zip.addFile('activityLogs.json', Buffer.from(JSON.stringify(activityLogs, null, 2)));

    // Add all assets
    if (fs.existsSync(assetDir)) {
      const assetFiles = fs.readdirSync(assetDir);
      assetFiles.forEach((file) => {
        const filePath = path.join(assetDir, file);
        if (fs.statSync(filePath).isFile()) {
          zip.addLocalFile(filePath, 'assets', file);
        }
      });
    }

    // Add metadata
    const metadata = {
      version: '2.0.0',
      dbType: 'mongodb',
      timestamp: new Date().toISOString(),
      app: 'E-Cop Wiki',
      entryCount: entries.length,
      userCount: users.length,
      tagCount: tags.length,
      assetCount: fs.existsSync(assetDir) ? fs.readdirSync(assetDir).length : 0,
    };
    zip.addFile('metadata.json', Buffer.from(JSON.stringify(metadata, null, 2)));

    // Write ZIP file
    zip.writeZip(destinationPath);

    return {
      success: true,
      path: destinationPath,
      metadata,
    };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Import database from ZIP file (MongoDB version)
 * @param {string} zipPath - Path to the ZIP file to import
 * @returns {Object} Result object with success status
 */
const importDatabase = async (zipPath) => {
  let tempDir = null;

  try {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    // Check if it's a MongoDB backup (has entries.json) or old SQLite backup (has vault.db)
    const hasEntriesJson = zipEntries.some((e) => e.entryName === 'entries.json');
    const hasVaultDb = zipEntries.some((e) => e.entryName === 'vault.db');

    if (hasVaultDb && !hasEntriesJson) {
      return {
        success: false,
        message: 'This is an old SQLite backup. MongoDB backups are required (v2.0+).',
      };
    }

    if (!hasEntriesJson) {
      return { success: false, message: 'Invalid backup: entries.json not found' };
    }

    // Extract to temporary location first
    tempDir = path.join(os.tmpdir(), `ecop-restore-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    zip.extractAllTo(tempDir, true);

    // Read exported data
    const usersData = JSON.parse(fs.readFileSync(path.join(tempDir, 'users.json'), 'utf-8'));
    const tagsData = JSON.parse(fs.readFileSync(path.join(tempDir, 'tags.json'), 'utf-8'));
    const entriesData = JSON.parse(fs.readFileSync(path.join(tempDir, 'entries.json'), 'utf-8'));

    let activityLogsData = [];
    if (fs.existsSync(path.join(tempDir, 'activityLogs.json'))) {
      activityLogsData = JSON.parse(
        fs.readFileSync(path.join(tempDir, 'activityLogs.json'), 'utf-8')
      );
    }

    // Create backup of current assets
    const backupTimestamp = Date.now();
    const currentAssetsBackup = path.join(userDataPath, `assets-backup-${backupTimestamp}`);

    if (fs.existsSync(assetDir)) {
      fs.cpSync(assetDir, currentAssetsBackup, { recursive: true });
      console.log(`Current assets backed up to: ${currentAssetsBackup}`);
    }

    // Clear existing data
    await User.deleteMany({});
    await Tag.deleteMany({});
    await Entry.deleteMany({});
    await ActivityLog.deleteMany({});

    // Import data
    if (usersData.length > 0) {
      await User.insertMany(usersData);
    }
    if (tagsData.length > 0) {
      await Tag.insertMany(tagsData);
    }
    if (entriesData.length > 0) {
      await Entry.insertMany(entriesData);
    }
    if (activityLogsData.length > 0) {
      await ActivityLog.insertMany(activityLogsData);
    }

    // Replace assets
    const tempAssetsDir = path.join(tempDir, 'assets');
    if (fs.existsSync(tempAssetsDir)) {
      if (fs.existsSync(assetDir)) {
        fs.rmSync(assetDir, { recursive: true, force: true });
      }
      fs.mkdirSync(assetDir, { recursive: true });
      fs.cpSync(tempAssetsDir, assetDir, { recursive: true });
      console.log('Assets replaced successfully');
    }

    // Clean up temp files
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    return {
      success: true,
      message: `Database imported successfully. Imported ${entriesData.length} entries, ${usersData.length} users, ${tagsData.length} tags.`,
      requiresRestart: false,
      backupLocation: currentAssetsBackup,
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
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `auto-backup-${timestamp}.zip`;
    const backupPath = path.join(backupDir, filename);

    const result = await exportDatabase(backupPath);

    if (result.success) {
      console.log(`Auto-backup created: ${filename}`);
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

    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith('auto-backup-') && f.endsWith('.zip'))
      .map((f) => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

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

    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith('.zip'))
      .map((f) => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          size: stats.size,
          date: stats.mtime,
          isAuto: f.startsWith('auto-backup-'),
        };
      })
      .sort((a, b) => b.date - a.date);

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    return {
      count: files.length,
      totalSize,
      backups: files,
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
  backupDir,
};
