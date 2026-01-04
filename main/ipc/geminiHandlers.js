/**
 * Gemini AI IPC Handlers
 * Handle AI assistant operations
 */
const { askGeminiWithContext } = require('../api/gemini');

/**
 * Register Gemini handlers
 * @param {Electron.IpcMain} ipcMain - IPC main instance
 */
const register = (ipcMain) => {
    ipcMain.handle('ask-gemini', async (event, { query, context }) => {
        return await askGeminiWithContext(query, context);
    });
};

module.exports = { register };
