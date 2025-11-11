const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVideoInfo: (url) => ipcRenderer.invoke('get-video-info', url),
  downloadAudio: (params) => ipcRenderer.invoke('download-audio', params),
  showSaveDialog: (defaultName) => ipcRenderer.invoke('show-save-dialog', defaultName),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, percent) => callback(percent))
});