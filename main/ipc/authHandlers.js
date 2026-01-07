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
        try {
            const result = await userService.verifyUser(username, password);
            if (result.success) {
                setSession({ username: result.username, role: result.role });
                // Log activity but don't fail login if logging fails
                try {
                    await activityLogService.logActivity(
                        username,
                        'login',
                        'auth',
                        null,
                        null,
                        `User logged in with role: ${result.role}`
                    );
                } catch (logError) {
                    console.error('Failed to log login activity:', logError);
                }
                return { success: true, user: getSession() };
            }
            return result;
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed: ' + error.message };
        }
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
