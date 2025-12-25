const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wikiAPI', {
  saveEntry: (data) => ipcRenderer.invoke('save-wiki-entry', data),
  getEntries: () => ipcRenderer.invoke('get-wiki-entries'),
  askGemini: (query, context) => ipcRenderer.invoke('ask-gemini', { query, context }),
  publishEntry: (id) => ipcRenderer.invoke('publish-to-ipfs', id),
  verifyIntegrity: () => ipcRenderer.invoke('verify-integrity'),
  connectSwarm: (multiaddr) => ipcRenderer.invoke('connect-swarm', multiaddr),
  captureWebSnapshot: (url) => ipcRenderer.invoke('capture-web-snapshot', url),
  getPeerId: () => ipcRenderer.invoke('get-peer-id'),
  createPrivateSwarm: () => ipcRenderer.invoke('create-private-swarm'),
  login: (creds) => ipcRenderer.invoke('login', creds),
  logout: () => ipcRenderer.invoke('logout'),
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
});
