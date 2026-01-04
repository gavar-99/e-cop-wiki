/**
 * IPC Handlers Index
 * Registers all IPC handlers for the main process
 */

const windowHandlers = require('./windowHandlers');
const authHandlers = require('./authHandlers');
const databaseHandlers = require('./databaseHandlers');
const entryHandlers = require('./entryHandlers');
const userHandlers = require('./userHandlers');
const tagHandlers = require('./tagHandlers');
const preferencesHandlers = require('./preferencesHandlers');
const activityLogHandlers = require('./activityLogHandlers');
const ipfsHandlers = require('./ipfsHandlers');
const backupHandlers = require('./backupHandlers');
const geminiHandlers = require('./geminiHandlers');

/**
 * Register all IPC handlers
 * @param {Electron.IpcMain} ipcMain - IPC main instance
 * @param {BrowserWindow} mainWindow - Main window reference (needed for dialogs)
 */
const registerAll = (ipcMain, mainWindow) => {
    windowHandlers.register(ipcMain);
    authHandlers.register(ipcMain);
    databaseHandlers.register(ipcMain);
    entryHandlers.register(ipcMain);
    userHandlers.register(ipcMain);
    tagHandlers.register(ipcMain);
    preferencesHandlers.register(ipcMain);
    activityLogHandlers.register(ipcMain);
    ipfsHandlers.register(ipcMain);
    backupHandlers.register(ipcMain, mainWindow);
    geminiHandlers.register(ipcMain);
};

module.exports = {
    registerAll,
    windowHandlers,
    authHandlers,
    databaseHandlers,
    entryHandlers,
    userHandlers,
    tagHandlers,
    preferencesHandlers,
    activityLogHandlers,
    ipfsHandlers,
    backupHandlers,
    geminiHandlers
};
