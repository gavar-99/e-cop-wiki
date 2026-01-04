/**
 * IPFS IPC Handlers
 * Handle IPFS and swarm operations
 */
const { BrowserWindow } = require('electron');
const { entryService } = require('../services');
const {
    getSession,
    isAuthenticated,
    canEdit,
    isAdmin,
    permissionDenied,
    adminRequired
} = require('../middleware/authMiddleware');
const { publishToSwarm, connectToPeer, getPeerId, createPrivateSwarm } = require('../ipfs/ipfsHandler');
const { integrityService } = require('../services');

/**
 * Register IPFS handlers
 * @param {Electron.IpcMain} ipcMain - IPC main instance
 */
const register = (ipcMain) => {
    // Publish entry to IPFS
    ipcMain.handle('publish-to-ipfs', async (event, entryId) => {
        if (!isAuthenticated() || !canEdit()) {
            return permissionDenied();
        }

        const entry = await entryService.getEntryById(entryId);
        if (!entry) return { success: false, message: 'Entry not found' };

        return await publishToSwarm(entry);
    });

    // Verify integrity
    ipcMain.handle('verify-integrity', async () => {
        return await integrityService.verifyIntegrity();
    });

    // Connect to swarm peer
    ipcMain.handle('connect-swarm', async (event, multiaddr) => {
        return await connectToPeer(multiaddr);
    });

    // Get peer ID
    ipcMain.handle('get-peer-id', async () => {
        return await getPeerId();
    });

    // Create private swarm
    ipcMain.handle('create-private-swarm', async () => {
        if (!isAuthenticated() || !isAdmin()) {
            return adminRequired();
        }
        return await createPrivateSwarm();
    });

    // Capture web snapshot
    ipcMain.handle('capture-web-snapshot', async (event, targetUrl) => {
        if (!isAuthenticated() || !canEdit()) {
            return permissionDenied();
        }
        try {
            const { app } = require('electron');
            const path = require('path');
            const win = new BrowserWindow({
                show: false,
                webPreferences: { offscreen: true },
            });
            await win.loadURL(targetUrl);
            const pdfData = await win.webContents.printToPDF({});

            const tempPath = path.join(app.getPath('temp'), `snapshot-${Date.now()}.pdf`);
            require('fs').writeFileSync(tempPath, pdfData);

            return { success: true, filePath: tempPath };
        } catch (error) {
            console.error('Snapshot Error:', error);
            return { success: false, message: error.message };
        }
    });
};

module.exports = { register };
