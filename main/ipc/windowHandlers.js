/**
 * Window IPC Handlers
 * Handle window control operations
 */
const { BrowserWindow, dialog } = require('electron');

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

  // File selection dialog
  ipcMain.handle('select-files', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'] },
        { name: 'Documents', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled) {
      return { canceled: true, filePaths: [] };
    }

    // Return file paths and names
    const files = result.filePaths.map((filePath) => {
      const name = filePath.split(/[/\\]/).pop();
      return { path: filePath, name };
    });

    return { canceled: false, files };
  });
};

module.exports = { register };
