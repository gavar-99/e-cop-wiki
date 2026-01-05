/**
 * E-Cop Wiki - Main Process
 *
 * This is the main entry point for the Electron application.
 * It initializes the database, window, and registers all IPC handlers.
 */
const { app, BrowserWindow, protocol, net, Menu, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

// Core modules
const { initDB, disconnect } = require('./db/dbManager');
const { assetDir } = require('./db/mongoConnection');
const ipfsSidecar = require('./ipfs/sidecar');
const backupScheduler = require('./backupScheduler');

// IPC handlers registration
const { registerAll: registerIpcHandlers } = require('./ipc');

// Main window reference
let mainWindow = null;

// Developer mode flag - set to true for development features
const isDev = !app.isPackaged;

// Register custom protocol for secure image loading
protocol.registerSchemesAsPrivileged([
  { scheme: 'wiki-asset', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

/**
 * Create Application Menu (minimal - development tools only)
 */
function createMenu() {
  const template = [
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Create the main application window
 */
function createWindow() {
  // In production, icon is next to the exe; in dev, it's in project root
  const iconPath = app.isPackaged
    ? path.join(path.dirname(app.getPath('exe')), 'assets', 'images', 'app-main-logo.png')
    : path.join(__dirname, '../assets/images/app-main-logo.png');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  createMenu();

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
    console.log('🔧 Developer mode enabled');
  }

  // Register IPC handlers (needs mainWindow for dialogs)
  registerIpcHandlers(ipcMain, mainWindow);
}

/**
 * Initialize the application
 */
app.whenReady().then(async () => {
  // Initialize MongoDB connection
  const dbResult = await initDB();
  if (!dbResult.success) {
    console.error('Failed to initialize database:', dbResult.message);
  }

  // Start IPFS sidecar
  ipfsSidecar.start();

  // Start backup scheduler
  backupScheduler.startScheduler();

  // Handle the custom protocol for wiki assets
  protocol.handle('wiki-asset', (request) => {
    let fileName = request.url.replace('wiki-asset://', '');

    // Remove trailing slash if present
    if (fileName.endsWith('/')) {
      fileName = fileName.slice(0, -1);
    }

    // Remove query parameters/hashes if present
    const cleanName = decodeURIComponent(fileName.split(/[?#]/)[0]);
    const absolutePath = path.join(assetDir, cleanName);

    return net.fetch(url.pathToFileURL(absolutePath).toString());
  });

  // Create main window
  createWindow();
});

/**
 * Cleanup on application close
 */
app.on('window-all-closed', async () => {
  try {
    ipfsSidecar.stop();
    backupScheduler.stopScheduler();
    await disconnect();
  } catch (e) {
    console.error('Cleanup Error:', e);
  }
  if (process.platform !== 'darwin') app.quit();
});

/**
 * macOS: Re-create window when dock icon is clicked
 */
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
