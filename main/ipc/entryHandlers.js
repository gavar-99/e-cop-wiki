/**
 * Entry IPC Handlers
 * Handle entry CRUD operations
 */
const { entryService, activityLogService, assetService } = require('../services');
const {
    getSession,
    isAuthenticated,
    canEdit,
    isAdmin,
    permissionDenied,
    adminRequired
} = require('../middleware/authMiddleware');

/**
 * Register entry handlers
 * @param {Electron.IpcMain} ipcMain - IPC main instance
 */
const register = (ipcMain) => {
    // Get all entries
    ipcMain.handle('get-wiki-entries', async () => {
        return await entryService.getEntries();
    });

    // Save new entry
    ipcMain.handle('save-wiki-entry', async (event, { title, content, filePaths = [], tags = [], infobox = [] }) => {
        if (!isAuthenticated() || !canEdit()) {
            return permissionDenied();
        }

        try {
            const assetData = [];
            for (const filePath of filePaths) {
                const { hash, fileName } = assetService.saveAssetWithHash(filePath);
                assetData.push({ fileName, hash });
            }

            const session = getSession();
            const result = await entryService.createEntry({
                title,
                content,
                tags,
                infobox,
                assets: assetData,
                authorUsername: session.username
            });

            if (result.success) {
                await activityLogService.logActivity(
                    session.username,
                    'create',
                    'entry',
                    result.entryId,
                    title,
                    `Created entry with ${assetData.length} assets and ${infobox.length} infobox fields`
                );
            }

            return result;
        } catch (error) {
            console.error('Storage Error:', error);
            return { success: false, message: error.message };
        }
    });

    // Update entry
    ipcMain.handle('update-wiki-entry', async (event, { entryId, title, content, tags = [], infobox = [], removedAssetIds = [] }) => {
        if (!isAuthenticated() || !canEdit()) {
            return permissionDenied();
        }

        try {
            const session = getSession();
            const entry = await entryService.getEntryById(entryId);
            if (!entry) {
                return { success: false, message: 'Entry not found' };
            }

            if (session.role === 'editor' && entry.author_username !== session.username) {
                return { success: false, message: 'You can only edit your own entries' };
            }

            const result = await entryService.updateEntry({ entryId, title, content, tags, infobox, removedAssetIds });

            if (result.success) {
                await activityLogService.logActivity(
                    session.username,
                    'edit',
                    'entry',
                    entryId,
                    title,
                    `Updated entry: removed ${removedAssetIds.length} assets`
                );
            }

            return result;
        } catch (error) {
            console.error('Update Error:', error);
            return { success: false, message: error.message };
        }
    });

    // Delete entry (soft delete)
    ipcMain.handle('delete-wiki-entry', async (event, entryId) => {
        if (!isAuthenticated() || !canEdit()) {
            return permissionDenied();
        }

        try {
            const session = getSession();
            const entry = await entryService.getEntryById(entryId);
            if (!entry) {
                return { success: false, message: 'Entry not found' };
            }

            if (session.role === 'editor' && entry.author_username !== session.username) {
                return { success: false, message: 'You can only delete your own entries' };
            }

            const result = await entryService.deleteEntry(entryId, session.username);

            if (result.success) {
                await activityLogService.logActivity(
                    session.username,
                    'delete',
                    'entry',
                    entryId,
                    entry.title,
                    'Soft deleted entry'
                );
            }

            return result;
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    // Restore entry
    ipcMain.handle('restore-wiki-entry', async (event, entryId) => {
        if (!isAuthenticated() || !isAdmin()) {
            return adminRequired();
        }

        try {
            const session = getSession();
            const result = await entryService.restoreEntry(entryId);
            const entry = await entryService.getEntryById(entryId);

            if (result.success && entry) {
                await activityLogService.logActivity(
                    session.username,
                    'restore',
                    'entry',
                    entryId,
                    entry.title,
                    'Restored deleted entry'
                );
            }

            return result;
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    // Add assets to entry
    ipcMain.handle('add-entry-assets', async (event, { entryId, filePaths }) => {
        if (!isAuthenticated() || !canEdit()) {
            return permissionDenied();
        }

        try {
            const assets = [];
            for (const filePath of filePaths) {
                const { hash, fileName } = assetService.saveAssetWithHash(filePath);
                assets.push({ fileName, hash });
            }

            return await entryService.addEntryAssets(entryId, assets);
        } catch (error) {
            return { success: false, message: error.message };
        }
    });

    // Get entry assets
    ipcMain.handle('get-entry-assets', async (event, entryId) => {
        return await entryService.getEntryAssets(entryId);
    });

    // Update asset caption
    ipcMain.handle('update-asset-caption', async (event, { assetId, caption }) => {
        if (!isAuthenticated() || !canEdit()) {
            return permissionDenied();
        }
        return await entryService.updateAssetCaption(assetId, caption);
    });

    // Get entry infobox
    ipcMain.handle('get-entry-infobox', async (event, entryId) => {
        return await entryService.getEntryInfobox(entryId);
    });

    // Search entries
    ipcMain.handle('search-entries', async (event, query) => {
        return await entryService.searchEntries(query);
    });

    // Search autocomplete
    ipcMain.handle('search-autocomplete', async (event, query) => {
        return await entryService.searchAutocomplete(query);
    });
};

module.exports = { register };
