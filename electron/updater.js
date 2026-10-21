'use strict';

const { app, Notification, nativeImage } = require('electron');
const path = require('path');

const CHECK_INTERVAL = 6 * 60 * 60 * 1000;
const FIRST_CHECK_DELAY = 12 * 1000;

let updater = null;
let targetWindow = null;
let started = false;
let checking = null;
let notifiedAvailable = null;
let notifiedReady = null;

const state = {
  status: app.isPackaged ? 'idle' : 'dev',
  currentVersion: app.getVersion(),
  version: null,
  releaseName: '',
  releaseDate: null,
  percent: 0,
  error: '',
  checkedAt: null
};

function broadcast() {
  if (targetWindow && !targetWindow.isDestroyed()) {
    targetWindow.webContents.send('update:status', { ...state });
  }
}

function setState(patch) {
  Object.assign(state, patch);
  broadcast();
}

function getUpdater() {
  if (updater) return updater;
  try {
    ({ autoUpdater: updater } = require('electron-updater'));
  } catch (err) {
    setState({ status: 'error', error: `Update module could not load: ${err.message}` });
    return null;
  }
  updater.logger = console;
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = false;
  updater.allowDowngrade = false;

  updater.on('checking-for-update', () => {
    setState({ status: 'checking', error: '', percent: 0 });
  });

  updater.on('update-available', (info) => {
    setState({
      status: 'available',
      version: info.version || null,
      releaseName: info.releaseName || '',
      releaseDate: info.releaseDate || null,
      percent: 0,
      error: '',
      checkedAt: Date.now()
    });
    if (notifiedAvailable !== info.version) {
      notifiedAvailable = info.version;
      notify(
        'Update available',
        `Wheel and Form ${info.version} is ready to download. Open the app to update.`
      );
    }
  });

  updater.on('update-not-available', () => {
    setState({
      status: 'not-available',
      version: null,
      percent: 0,
      error: '',
      checkedAt: Date.now()
    });
  });

  updater.on('download-progress', (progress) => {
    setState({
      status: 'downloading',
      percent: Math.max(0, Math.min(100, Math.round(Number(progress.percent) || 0)))
    });
  });

  updater.on('update-downloaded', (info) => {
    setState({
      status: 'downloaded',
      version: info.version || state.version,
      percent: 100,
      error: '',
      checkedAt: Date.now()
    });
    if (notifiedReady !== info.version) {
      notifiedReady = info.version;
      notify(
        'Update ready',
        'Wheel and Form has the new version. Restart the app to finish installing.'
      );
    }
  });

  updater.on('error', (err) => {
    const message = err && err.message ? err.message : String(err || 'Update check failed.');
    console.error('[Wheel and Form] update error', err);
    setState({ status: 'error', error: message, percent: 0, checkedAt: Date.now() });
  });

  return updater;
}

function notify(title, body) {
  try {
    if (!Notification.isSupported()) return;
    const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    const note = new Notification({
      title,
      body,
      icon: icon.isEmpty() ? undefined : icon,
      silent: false
    });
    note.on('click', () => {
      if (!targetWindow || targetWindow.isDestroyed()) return;
      if (targetWindow.isMinimized()) targetWindow.restore();
      targetWindow.show();
      targetWindow.focus();
    });
    note.show();
  } catch (err) {
    console.warn('[Wheel and Form] could not show update notification', err.message);
  }
}

function attach(win) {
  targetWindow = win;
}

async function check(manual = false) {
  const autoUpdater = getUpdater();
  if (!app.isPackaged) {
    return { ...state, status: 'dev' };
  }
  if (!autoUpdater) return { ...state };
  if (checking) return checking;
  if (state.status === 'downloading' || state.status === 'downloaded') {
    return { ...state };
  }

  setState({ status: 'checking', error: '', checkedAt: Date.now() });
  checking = autoUpdater.checkForUpdates()
    .then(() => ({ ...state }))
    .catch((err) => {
      const message = err && err.message ? err.message : String(err || 'Update check failed.');
      console.error('[Wheel and Form] update check failed', err);
      setState({ status: 'error', error: message, percent: 0, checkedAt: Date.now() });
      return { ...state };
    })
    .finally(() => { checking = null; });

  return checking;
}

function download() {
  const autoUpdater = getUpdater();
  if (!app.isPackaged) return { ...state, status: 'dev' };
  if (!autoUpdater) return { ...state };
  if (state.status !== 'available') return { ...state };

  setState({ status: 'downloading', percent: 0, error: '' });
  autoUpdater.downloadUpdate().catch((err) => {
    const message = err && err.message ? err.message : String(err || 'Update download failed.');
    console.error('[Wheel and Form] update download failed', err);
    setState({ status: 'error', error: message, percent: 0, checkedAt: Date.now() });
  });
  return { ...state };
}

function install() {
  if (!app.isPackaged) return { ok: false, error: 'Updates are only available in the installed app.' };
  if (state.status !== 'downloaded') return { ok: false, error: 'No update has been downloaded yet.' };
  const autoUpdater = getUpdater();
  if (!autoUpdater) return { ok: false, error: state.error || 'Updater unavailable.' };
  setImmediate(() => {
    try {
      autoUpdater.quitAndInstall(true, true);
    } catch (err) {
      console.error('[Wheel and Form] update install failed', err);
      setState({ status: 'error', error: err.message || 'Could not launch the installer.' });
    }
  });
  return { ok: true };
}

function start() {
  if (started) return;
  started = true;
  if (!app.isPackaged) return;

  const first = setTimeout(() => { check(false); }, FIRST_CHECK_DELAY);
  if (first.unref) first.unref();
  const interval = setInterval(() => { check(false); }, CHECK_INTERVAL);
  if (interval.unref) interval.unref();
}

module.exports = {
  attach,
  start,
  check,
  download,
  install,
  getState: () => ({ ...state })
};
