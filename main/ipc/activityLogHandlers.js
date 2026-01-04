/**
 * Activity Log IPC Handlers
 * Handle activity log operations
 */
const { activityLogService } = require('../services');
const { isAuthenticated, isAdmin, adminRequired } = require('../middleware/authMiddleware');

/**
 * Register activity log handlers
 * @param {Electron.IpcMain} ipcMain - IPC main instance
 */
const register = (ipcMain) => {
    // Get activity logs
    ipcMain.handle('get-activity-logs', async (event, options) => {
        if (!isAuthenticated() || !isAdmin()) {
            return adminRequired();
        }
        return await activityLogService.getActivityLogs(options);
    });

    // Get log stats
    ipcMain.handle('get-log-stats', async () => {
        if (!isAuthenticated() || !isAdmin()) {
            return adminRequired();
        }
        return await activityLogService.getLogStats();
    });
};

module.exports = { register };
