'use strict';

const { contextBridge, ipcRenderer, webUtils } = require('electron');

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

function listen(channel, callback) {
  const handler = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('api', {
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return file && file.path ? file.path : '';
    }
  },

  window: {
    minimize: () => invoke('window:minimize'),
    maximize: () => invoke('window:maximize'),
    close: () => invoke('window:close'),
    isMaximized: () => invoke('window:is-maximized'),
    onState: (cb) => listen('window:state', cb)
  },

  app: {
    info: () => invoke('app:info'),
    openExternal: (url) => invoke('app:open-external', url),
    clipboardText: (text) => invoke('app:clipboard-text', text),
    openSettingsFile: () => invoke('app:open-settings-file'),
    onOpenSettings: (cb) => listen('wheelandform:open-settings', cb)
  },

  registry: {
    get: () => invoke('registry:get')
  },

  settings: {
    get: () => invoke('settings:get'),
    set: (patch) => invoke('settings:set', patch),
    pickFolder: () => invoke('settings:pick-folder')
  },

  tools: {
    status: () => invoke('tools:status'),
    refresh: () => invoke('tools:refresh'),
    install: (name) => invoke('tools:install', name),
    locate: (name) => invoke('tools:locate', name),
    onInstallOutput: (cb) => listen('tools:install-output', cb),
    onProgress: (cb) => listen('job:progress', cb)
  },

  file: {
    probe: (filePath) => invoke('file:probe', filePath),
    thumb: (filePath, size) => invoke('file:thumb', filePath, size),
    pick: (options) => invoke('file:pick', options),
    extra: (kind) => invoke('file:extra', kind),
    duplicate: (filePath) => invoke('file:duplicate', filePath),
    copy: (filePath) => invoke('file:copy', filePath),
    copyPath: (filePath) => invoke('file:copy-path', filePath),
    reveal: (filePath) => invoke('file:reveal', filePath),
    open: (filePath) => invoke('file:open', filePath),
    move: (filePath) => invoke('file:move', filePath),
    terminal: (filePath) => invoke('file:terminal', filePath),
    showInFolder: (filePath) => invoke('file:show-in-folder', filePath)
  },

  float: {
    show: (filePath) => invoke('float:show', filePath),
    close: () => invoke('float:close')
  },

  convert: {
    run: (job) => invoke('convert:run', job)
  },

  tool: {
    run: (job) => invoke('tool:run', job)
  },

  update: {
    getState: () => invoke('update:get-state'),
    check: (manual) => invoke('update:check', Boolean(manual)),
    download: () => invoke('update:download'),
    install: () => invoke('update:install'),
    onStatus: (cb) => listen('update:status', cb)
  },

  desktop: {
    convert: (payload) => invoke('desktop:convert', payload),
    tool: (payload) => invoke('desktop:tool', payload),
    hide: () => invoke('desktop:hide'),
    closeStatus: () => invoke('desktop:status-close'),
    notify: (payload) => invoke('desktop:notify', payload),
    openSettings: () => invoke('desktop:open-settings'),
    busy: () => invoke('desktop:busy'),
    onShow: (cb) => listen('desktop:show', cb),
    onReset: (cb) => listen('desktop:reset', cb),
    onMove: (cb) => listen('desktop:move', cb),
    onDragEnter: (cb) => listen('desktop:dragenter', cb),
    onHover: (cb) => listen('desktop:hover', cb),
    onLeave: (cb) => listen('desktop:leave', cb),
    onDrop: (cb) => listen('desktop:drop', cb),
    onMode: (cb) => listen('desktop:mode', cb),
    onMouseUp: (cb) => listen('desktop:mouseup', cb),
    onCancel: (cb) => listen('desktop:cancel', cb),
    onStatus: (cb) => listen('desktop:status', cb)
  }
});
