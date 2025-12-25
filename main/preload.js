const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wikiAPI', {
  saveEntry: (data) => ipcRenderer.invoke('save-wiki-entry', data),
  getEntries: () => ipcRenderer.invoke('get-wiki-entries'),
  getAllTags: () => ipcRenderer.invoke('get-all-tags'),
  getEntryTags: (entryId) => ipcRenderer.invoke('get-entry-tags', entryId),
  searchEntries: (query) => ipcRenderer.invoke('search-entries', query),
  askGemini: (query, context) => ipcRenderer.invoke('ask-gemini', { query, context }),
  publishEntry: (id) => ipcRenderer.invoke('publish-to-ipfs', id),
  verifyIntegrity: () => ipcRenderer.invoke('verify-integrity'),
  connectSwarm: (multiaddr) => ipcRenderer.invoke('connect-swarm', multiaddr),
  captureWebSnapshot: (url) => ipcRenderer.invoke('capture-web-snapshot', url),
  getPeerId: () => ipcRenderer.invoke('get-peer-id'),
  createPrivateSwarm: () => ipcRenderer.invoke('create-private-swarm'),
  login: (creds) => ipcRenderer.invoke('login', creds),
  logout: () => ipcRenderer.invoke('logout'),
  // User Management
  getUsers: () => ipcRenderer.invoke('get-users'),
  createUser: (data) => ipcRenderer.invoke('create-user', data),
  deleteUser: (username) => ipcRenderer.invoke('delete-user', username),
  updateUserRole: (data) => ipcRenderer.invoke('update-user-role', data),
  toggleUserActive: (username) => ipcRenderer.invoke('toggle-user-active', username),
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  // Menu event listeners
  onOpenUserManagement: (callback) => ipcRenderer.on('open-user-management', callback),
  onLogout: (callback) => ipcRenderer.on('logout-user', callback),
});
