/**
 * Tag IPC Handlers
 * Handle tag/keyword operations
 */
const { tagService } = require('../services');
const {
  getSession,
  isAuthenticated,
  isAdmin,
  notAuthenticated,
  adminRequired
} = require('../middleware/authMiddleware');

/**
 * Register tag handlers
 * @param {Electron.IpcMain} ipcMain - IPC main instance
 */
const register = (ipcMain) => {
  // Get all tags
  ipcMain.handle('get-all-tags', async () => {
    return await tagService.getAllTags();
  });

  // Get entry tags
  ipcMain.handle('get-entry-tags', async (event, entryId) => {
    return await tagService.getEntryTags(entryId);
  });

  // Rename keyword
  ipcMain.handle('rename-keyword', async (event, { oldName, newName }) => {
    if (!isAuthenticated()) {
      return notAuthenticated();
    }
    return await tagService.renameKeyword(oldName, newName);
  });

  // Delete keyword
  ipcMain.handle('delete-keyword', async (event, keywordId) => {
    if (!isAuthenticated() || !isAdmin()) {
      return adminRequired();
    }
    return await tagService.deleteKeyword(keywordId);
  });

  // Get entries by keyword
  ipcMain.handle('get-entries-by-keyword', async (event, keywordId) => {
    return await tagService.getEntriesByKeyword(keywordId);
  });
};

module.exports = { register };
