/**
 * Auth IPC Handlers
 * Handle authentication operations
 */
const { userService, activityLogService } = require('../services');
const { getSession, setSession, clearSession } = require('../middleware/authMiddleware');

/**
 * Register auth handlers
 * @param {Electron.IpcMain} ipcMain - IPC main instance
 */
const register = (ipcMain) => {
    ipcMain.handle('login', async (event, { username, password }) => {
        const result = await userService.verifyUser(username, password);
        if (result.success) {
            setSession({ username: result.username, role: result.role });
            await activityLogService.logActivity(
                username,
                'login',
                'auth',
                null,
                null,
                `User logged in with role: ${result.role}`
            );
            return { success: true, user: getSession() };
        }
        return result;
    });

    ipcMain.handle('logout', async () => {
        const session = getSession();
        if (session) {
            await activityLogService.logActivity(
                session.username,
                'logout',
                'auth',
                null,
                null,
                'User logged out'
            );
        }
        clearSession();
        return { success: true };
    });
};

module.exports = { register };
