'use strict';

const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  outputMode: 'beside', // beside | ask | custom
  customFolder: '',
  revealAfter: false,
  desktopWheel: true,
  toolPaths: {},
  setupDismissed: false
};

let cache = null;

function filePath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function load() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(filePath(), 'utf8');
    cache = { ...DEFAULTS, ...JSON.parse(raw) };
    cache.toolPaths = { ...(cache.toolPaths || {}) };
  } catch {
    cache = { ...DEFAULTS, toolPaths: {} };
  }
  return cache;
}

function save() {
  try {
    fs.mkdirSync(path.dirname(filePath()), { recursive: true });
    fs.writeFileSync(filePath(), JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error('settings save failed', err);
  }
}

function get() {
  return { ...load() };
}

function set(patch = {}) {
  load();
  if (typeof patch.outputMode === 'string') cache.outputMode = patch.outputMode;
  if (typeof patch.customFolder === 'string') cache.customFolder = patch.customFolder;
  if (typeof patch.revealAfter === 'boolean') cache.revealAfter = patch.revealAfter;
  if (typeof patch.desktopWheel === 'boolean') cache.desktopWheel = patch.desktopWheel;
  if (typeof patch.setupDismissed === 'boolean') cache.setupDismissed = patch.setupDismissed;
  if (patch.toolPaths && typeof patch.toolPaths === 'object') {
    cache.toolPaths = { ...cache.toolPaths, ...patch.toolPaths };
    for (const [k, v] of Object.entries(cache.toolPaths)) {
      if (!v) delete cache.toolPaths[k];
    }
  }
  save();
  return get();
}

module.exports = { get, set, DEFAULTS };
