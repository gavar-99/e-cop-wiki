/**
 * Backup IPC Handlers
 * Handle backup and restore operations
 */
const { dialog } = require('electron');
const { isAuthenticated, isAdmin, adminRequired } = require('../middleware/authMiddleware');
const { exportDatabase, importDatabase, createAutoBackup, getBackupStats, deleteBackup } = require('../db/backupManager');
const backupScheduler = require('../backupScheduler');

/**
 * Register backup handlers
 * @param {Electron.IpcMain} ipcMain - IPC main instance
 * @param {BrowserWindow} mainWindow - Main window reference
 */
const register = (ipcMain, mainWindow) => {
    // Export database
    ipcMain.handle('export-database', async () => {
        if (!isAuthenticated() || !isAdmin()) {
            return adminRequired();
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
        if (!isAuthenticated() || !isAdmin()) {
            return adminRequired();
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
        if (!isAuthenticated() || !isAdmin()) {
            return adminRequired();
        }
        return await createAutoBackup();
    });

    // Get backup stats
    ipcMain.handle('get-backup-stats', async () => {
        if (!isAuthenticated() || !isAdmin()) {
            return adminRequired();
        }
        return getBackupStats();
    });

    // Delete backup
    ipcMain.handle('delete-backup', async (event, filename) => {
        if (!isAuthenticated() || !isAdmin()) {
            return adminRequired();
        }
        return deleteBackup(filename);
    });

    // Update backup schedule
    ipcMain.handle('update-backup-schedule', async (event, schedule) => {
        if (!isAuthenticated() || !isAdmin()) {
            return adminRequired();
        }
        return backupScheduler.updateSchedule(schedule);
    });

    // Get backup schedule
    ipcMain.handle('get-backup-schedule', async () => {
        if (!isAuthenticated() || !isAdmin()) {
            return adminRequired();
        }
        return { success: true, schedule: backupScheduler.getSchedule() };
    });
};

module.exports = { register };
