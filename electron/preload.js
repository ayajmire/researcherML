/**
 * Electron Preload Script
 * Exposes limited APIs to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  platform: process.platform,
  isDev: process.argv.includes('--dev')
});
