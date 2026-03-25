const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cinnamon', {
  register: (data) => ipcRenderer.invoke('auth:register', data),
  login: (data) => ipcRenderer.invoke('auth:login', data),
  addPassword: (data) => ipcRenderer.invoke('passwords:add', data),
  getPasswords: (data) => ipcRenderer.invoke('passwords:get', data),
});
