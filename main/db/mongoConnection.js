const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const os = require('os');

let userDataPath;
try {
  if (process.env.TEST_MODE === 'true') {
    throw new Error('Test Mode Active');
  }
  const electron = require('electron');
  if (electron.app) {
    userDataPath = electron.app.getPath('userData');
  } else {
    throw new Error('Electron app not available');
  }
} catch (e) {
  console.log('Running in detached/test mode. Using temp directory.');
  userDataPath = path.join(os.tmpdir(), 'ecop-wiki-test');
}

const configPath = path.join(userDataPath, 'db-config.json');
const assetDir = path.join(userDataPath, 'assets');

// Ensure directories exist
if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
if (!fs.existsSync(assetDir)) fs.mkdirSync(assetDir, { recursive: true });

// Default configuration
const defaultConfig = {
  connectionType: 'local', // 'local', 'lan', 'internet'
  local: {
    uri: 'mongodb://127.0.0.1:27017/ecop-wiki'
  },
  lan: {
    uri: 'mongodb://192.168.1.100:27017/ecop-wiki'
  },
  internet: {
    uri: 'mongodb+srv://username:password@cluster.mongodb.net/ecop-wiki'
  }
};

// Load or create config
const loadConfig = () => {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return { ...defaultConfig, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error loading DB config:', e.message);
  }
  return defaultConfig;
};

// Save config
const saveConfig = (config) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
};

// Get current config
const getConfig = () => loadConfig();

// Update config
const updateConfig = (newConfig) => {
  const current = loadConfig();
  const updated = { ...current, ...newConfig };
  return saveConfig(updated);
};

// Connection state
let isConnected = false;
let connectionError = null;

// Connect to MongoDB
const connect = async (forceReconnect = false) => {
  if (isConnected && !forceReconnect) {
    return { success: true, message: 'Already connected' };
  }

  // Disconnect if already connected
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  const config = loadConfig();
  const connectionType = config.connectionType;
  const uri = config[connectionType]?.uri;

  if (!uri) {
    connectionError = 'No URI configured for connection type: ' + connectionType;
    return { success: false, message: connectionError };
  }

  try {
    console.log(`Connecting to MongoDB (${connectionType}): ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    isConnected = true;
    connectionError = null;
    console.log('MongoDB connected successfully');
    return { success: true, connectionType };
  } catch (error) {
    isConnected = false;
    connectionError = error.message;
    console.error('MongoDB connection error:', error.message);
    return { success: false, message: error.message };
  }
};

// Disconnect from MongoDB
const disconnect = async () => {
  try {
    await mongoose.disconnect();
    isConnected = false;
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Get connection status
const getStatus = () => ({
  isConnected,
  connectionError,
  connectionType: loadConfig().connectionType,
  readyState: mongoose.connection.readyState // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
});

// Test a connection URI
const testConnection = async (uri) => {
  try {
    const testConn = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    }).asPromise();

    await testConn.close();
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err.message);
  connectionError = err.message;
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
  isConnected = false;
});

module.exports = {
  mongoose,
  connect,
  disconnect,
  getStatus,
  getConfig,
  updateConfig,
  testConnection,
  assetDir,
  userDataPath
};
