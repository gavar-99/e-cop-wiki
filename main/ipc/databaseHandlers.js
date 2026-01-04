/**
 * Database IPC Handlers
 * Handle database connection operations
 */
const mongoConnection = require('../db/mongoConnection');

/**
 * Register database connection handlers
 * @param {Electron.IpcMain} ipcMain - IPC main instance
 */
const register = (ipcMain) => {
    ipcMain.handle('get-db-status', async () => {
        return mongoConnection.getStatus();
    });

    ipcMain.handle('get-db-config', async () => {
        return mongoConnection.getConfig();
    });

    ipcMain.handle('update-db-config', async (event, config) => {
        return mongoConnection.updateConfig(config);
    });

    ipcMain.handle('test-db-connection', async (event, uri) => {
        return await mongoConnection.testConnection(uri);
    });

    ipcMain.handle('reconnect-db', async () => {
        return await mongoConnection.connect(true);
    });
};

module.exports = { register };
