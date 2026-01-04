/**
 * Window IPC Handlers
 * Handle window control operations
 */
const { BrowserWindow } = require('electron');

/**
 * Register window control handlers
 * @param {Electron.IpcMain} ipcMain - IPC main instance
 */
const register = (ipcMain) => {
    ipcMain.handle('window-minimize', () => {
        BrowserWindow.getFocusedWindow()?.minimize();
    });

    ipcMain.handle('window-maximize', () => {
        const win = BrowserWindow.getFocusedWindow();
        if (win) {
            win.isMaximized() ? win.unmaximize() : win.maximize();
        }
    });

    ipcMain.handle('window-close', () => {
        BrowserWindow.getFocusedWindow()?.close();
    });
};

module.exports = { register };
