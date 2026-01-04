/**
 * User Preferences IPC Handlers
 * Handle user preferences operations
 */
const { userPreferencesService } = require('../services');
const { getSession, isAuthenticated, permissionDenied } = require('../middleware/authMiddleware');

/**
 * Register preferences handlers
 * @param {Electron.IpcMain} ipcMain - IPC main instance
 */
const register = (ipcMain) => {
    // Get user preferences
    ipcMain.handle('get-user-preferences', async (event, username) => {
        const session = getSession();
        if (!isAuthenticated() || session.username !== username) {
            return null;
        }
        return await userPreferencesService.getUserPreferences(username);
    });

    // Update user preferences
    ipcMain.handle('update-user-preferences', async (event, { username, preferences }) => {
        const session = getSession();
        if (!isAuthenticated() || session.username !== username) {
            return permissionDenied();
        }
        return await userPreferencesService.updateUserPreferences(username, preferences);
    });

    // Reset user preferences
    ipcMain.handle('reset-user-preferences', async (event, username) => {
        const session = getSession();
        if (!isAuthenticated() || session.username !== username) {
            return permissionDenied();
        }
        return await userPreferencesService.resetUserPreferences(username);
    });
};

module.exports = { register };
