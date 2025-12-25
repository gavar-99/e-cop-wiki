const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('wikiAPI', {
  saveEntry: (data) => ipcRenderer.invoke('save-wiki-entry', data),
  getEntries: () => ipcRenderer.invoke('get-wiki-entries'),
  askGemini: (query, context) => ipcRenderer.invoke('ask-gemini', { query, context }),
  publishEntry: (id) => ipcRenderer.invoke('publish-to-ipfs', id),
});
