'use strict';

const { BrowserWindow, ipcMain, screen, app } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const settings = require('./settings');
const registry = require('./converter/registry');
const engine = require('./converter/engine');

const PRELOAD = path.join(__dirname, 'preload.js');

let overlay = null;
let overlayReady = false;
let pendingShow = null;
let status = null;
let helper = null;
let helperBuffer = '';
let helperEnabled = false;
let helperGeneration = 0;
let helperRestartTimer = null;
let helperRestarts = 0;
let helperStartedAt = 0;
let disposed = false;
let lastPoint = { x: 0, y: 0 };
let activeDisplayId = null;
let hideTimer = null;
let statusTimer = null;
let lastStatus = null;
let busy = false;

function helperPath() {
  const packaged = path.join(process.resourcesPath, 'native', 'WheelAndFormDragHook.exe');
  if (app.isPackaged) return packaged;
  return path.join(__dirname, '..', 'native', 'bin', 'WheelAndFormDragHook.exe');
}

function dipPoint(x, y) {
  try {
    if (screen.screenToDipPoint) return screen.screenToDipPoint({ x, y });
  } catch (_) { /* older Electron */ }
  return { x, y };
}

function displayFor(x, y) {
  const p = dipPoint(x, y);
  return { point: p, display: screen.getDisplayNearestPoint({ x: Math.round(p.x), y: Math.round(p.y) }) };
}

function ensureOverlay() {
  if (overlay && !overlay.isDestroyed()) return overlay;
  overlayReady = false;
  overlay = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: true,
    acceptFirstMouse: true,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
      spellcheck: false
    }
  });
  overlay.setAlwaysOnTop(true, 'screen-saver');
  overlay.setSkipTaskbar(true);
  overlay.webContents.on('did-finish-load', () => {
    overlayReady = true;
    if (!overlay || overlay.isDestroyed()) return;
    if (!settings.get().desktopWheel) {
      pendingShow = null;
      overlay.hide();
      return;
    }
    if (pendingShow) {
      const payload = pendingShow;
      pendingShow = null;
      showOverlay(payload.mode, payload.x, payload.y);
    } else {
      overlay.hide();
    }
  });
  overlay.loadFile(path.join(__dirname, '..', 'src', 'desktop.html'));
  overlay.on('closed', () => { overlay = null; overlayReady = false; pendingShow = null; });
  return overlay;
}

function positionOverlay(display) {
  const win = ensureOverlay();
  const b = display.bounds;
  const current = win.getBounds();
  if (current.x !== b.x || current.y !== b.y || current.width !== b.width || current.height !== b.height) {
    win.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height });
  }
  return win;
}

function sendOverlay(channel, payload) {
  if (overlay && !overlay.isDestroyed()) overlay.webContents.send(channel, payload);
}

function showOverlay(mode, x, y) {
  if (!settings.get().desktopWheel) return;
  clearTimeout(hideTimer);
  const { display, point } = displayFor(x, y);
  lastPoint = point;
  activeDisplayId = display.id;
  const win = positionOverlay(display);
  const local = { x: Math.round(point.x - display.bounds.x), y: Math.round(point.y - display.bounds.y) };
  if (!overlayReady) {
    // Keep screen coordinates here. The overlay may finish loading while the
    // pointer is on another monitor; did-finish-load replays showOverlay(),
    // which converts them to local coordinates for the target display.
    pendingShow = { mode, x, y };
    return;
  }
  sendOverlay('desktop:show', { mode, x: local.x, y: local.y });
  // The native helper owns the OLE drop target. The Electron window only paints
  // the wheel and must stay click-through so the helper receives the drop.
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setIgnoreMouseEvents(true, { forward: true });
  // Always ask Windows to show it. isVisible() can be stale for transparent,
  // non-focusable windows after a hide, which made the wheel work only once.
  win.showInactive();
  win.moveTop();
}

function overlayPoint(x, y) {
  const { display, point } = displayFor(x, y);
  return {
    display,
    x: Math.round(point.x - display.bounds.x),
    y: Math.round(point.y - display.bounds.y)
  };
}

function moveOverlay(x, y) {
  const { display, point } = displayFor(x, y);
  lastPoint = point;
  // The wheel must stay where the drag started. Only re-anchor it if the
  // pointer crosses onto a different monitor, otherwise it follows the cursor
  // and the centre hub is always under the pointer.
  if (display.id !== activeDisplayId) {
    activeDisplayId = display.id;
    const win = positionOverlay(display);
    const local = { x: Math.round(point.x - display.bounds.x), y: Math.round(point.y - display.bounds.y) };
    sendOverlay('desktop:move', { x: local.x, y: local.y, recenter: true });
    if (!win.isVisible()) win.showInactive();
    win.moveTop();
  }
}

function prepareOverlay(x, y) {
  if (!settings.get().desktopWheel) return;
  clearTimeout(hideTimer);
  const { display, point } = displayFor(x, y);
  lastPoint = point;
  activeDisplayId = display.id;
  const win = positionOverlay(display);
  if (!overlayReady || win.isDestroyed()) return;
  // Show a click-through window the moment a file drag starts. OLE needs the
  // target to exist before the drag begins; it becomes interactive only when
  // the helper reports that the drag has actually passed the threshold.
  sendOverlay('desktop:reset', {});
  win.setAlwaysOnTop(false);
  win.setIgnoreMouseEvents(true, { forward: true });
  win.showInactive();
}

function hideOverlay(delay = 0) {
  clearTimeout(hideTimer);
  const run = () => {
    // Clear the previous drag before hiding so the next show cannot inherit a
    // stale anchor or file from the last drag.
    sendOverlay('desktop:reset', {});
    if (overlay && !overlay.isDestroyed()) {
      overlay.setIgnoreMouseEvents(true, { forward: true });
      overlay.setAlwaysOnTop(false);
      overlay.hide();
    }
  };
  if (delay) hideTimer = setTimeout(run, delay);
  else run();
}

function cancelOverlay() {
  sendOverlay('desktop:cancel', {});
  hideOverlay(120);
}

function handleHelperLine(line) {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch (_) { return; }
  if (!msg || !msg.type) return;
  if (msg.type === 'candidate') {
    prepareOverlay(msg.x, msg.y);
  } else if (msg.type === 'show') {
    showOverlay(msg.mode, msg.x, msg.y);
  } else if (msg.type === 'move') {
    moveOverlay(msg.x, msg.y);
  } else if (msg.type === 'mode') {
    sendOverlay('desktop:mode', { mode: msg.mode });
  } else if (msg.type === 'dragenter') {
    clearTimeout(hideTimer);
    const point = overlayPoint(msg.x, msg.y);
    sendOverlay('desktop:dragenter', { paths: Array.isArray(msg.paths) ? msg.paths : [], x: point.x, y: point.y });
  } else if (msg.type === 'hover') {
    const point = overlayPoint(msg.x, msg.y);
    sendOverlay('desktop:hover', { x: point.x, y: point.y });
  } else if (msg.type === 'leave') {
    sendOverlay('desktop:leave', {});
  } else if (msg.type === 'drop') {
    clearTimeout(hideTimer);
    const point = overlayPoint(msg.x, msg.y);
    sendOverlay('desktop:drop', { paths: Array.isArray(msg.paths) ? msg.paths : [], x: point.x, y: point.y });
    // The renderer normally hides the overlay as soon as it starts the job.
    // Keep a fallback so a renderer problem cannot leave a topmost window up.
    hideTimer = setTimeout(() => hideOverlay(), 2500);
    if (hideTimer.unref) hideTimer.unref();
  } else if (msg.type === 'mouseup') {
    sendOverlay('desktop:mouseup', {});
    // Give the native drop a moment to arrive, then get out of the way. A
    // plain click or a drag without a modifier has no wheel to wait for.
    hideOverlay(msg.open ? 700 : 40);
  } else if (msg.type === 'cancel') {
    cancelOverlay();
  }
}

function clearHelperRestart() {
  if (helperRestartTimer) {
    clearTimeout(helperRestartTimer);
    helperRestartTimer = null;
  }
}

function scheduleHelperRestart() {
  if (disposed || helperRestartTimer || !settings.get().desktopWheel) return;
  const delay = [1000, 2000, 5000, 10000][Math.min(Math.max(helperRestarts - 1, 0), 3)];
  helperRestartTimer = setTimeout(() => {
    helperRestartTimer = null;
    startHelper();
  }, delay);
  if (helperRestartTimer.unref) helperRestartTimer.unref();
}

function handleHelperExit(generation) {
  if (generation !== helperGeneration) return;
  const uptime = helperStartedAt ? Date.now() - helperStartedAt : 0;
  helper = null;
  helperEnabled = false;
  helperBuffer = '';
  helperStartedAt = 0;
  if (disposed || !settings.get().desktopWheel) return;
  if (uptime >= 30000) helperRestarts = 0;
  helperRestarts = Math.min(helperRestarts + 1, 4);
  scheduleHelperRestart();
}

function startHelper() {
  if (disposed || helper || helperEnabled) return;
  if (!settings.get().desktopWheel) return;
  clearHelperRestart();
  const exe = helperPath();
  if (!fs.existsSync(exe)) {
    console.error(`Desktop wheel helper not found: ${exe}`);
    return;
  }
  helperEnabled = true;
  helperBuffer = '';
  const generation = ++helperGeneration;
  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    handleHelperExit(generation);
  };
  try {
    const proc = spawn(exe, ['--parent', String(process.pid)], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    helper = proc;
    helperStartedAt = Date.now();
    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (chunk) => {
      helperBuffer += chunk;
      let index;
      while ((index = helperBuffer.indexOf('\n')) >= 0) {
        const line = helperBuffer.slice(0, index);
        helperBuffer = helperBuffer.slice(index + 1);
        handleHelperLine(line);
      }
    });
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', () => {});
    proc.on('exit', end);
    proc.on('error', end);
  } catch (err) {
    helper = null;
    helperEnabled = false;
    helperStartedAt = 0;
    helperRestarts = Math.min(helperRestarts + 1, 4);
    scheduleHelperRestart();
    console.error('Could not start desktop wheel helper:', err);
  }
}

function stopHelper() {
  helperEnabled = false;
  helperGeneration += 1;
  clearHelperRestart();
  if (helper) {
    try { helper.kill(); } catch (_) { /* ignore */ }
    helper = null;
  }
  helperBuffer = '';
  helperStartedAt = 0;
}

function restartHelperNow() {
  helperRestarts = 0;
  clearHelperRestart();
  startHelper();
}

function refresh() {
  if (settings.get().desktopWheel) {
    ensureOverlay();
    restartHelperNow();
  } else {
    stopHelper();
    hideOverlay();
  }
}

function setEnabled(enabled) {
  const next = Boolean(enabled);
  settings.set({ desktopWheel: next });
  if (next) {
    ensureOverlay();
    restartHelperNow();
  } else {
    stopHelper();
    hideOverlay();
  }
  return next;
}

// ---------------------------------------------------------------------------
// Status card
// ---------------------------------------------------------------------------

function ensureStatus() {
  if (status && !status.isDestroyed()) return status;
  status = new BrowserWindow({
    width: 392,
    height: 158,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    title: 'Wheel and Form',
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false
    }
  });
  status.setAlwaysOnTop(true, 'floating');
  status.loadFile(path.join(__dirname, '..', 'src', 'desktop-status.html'));
  status.on('closed', () => { status = null; });
  status.webContents.on('did-finish-load', () => {
    if (lastStatus) status.webContents.send('desktop:status', lastStatus);
  });
  return status;
}

function placeStatus() {
  const win = ensureStatus();
  const display = screen.getDisplayNearestPoint({ x: Math.round(lastPoint.x), y: Math.round(lastPoint.y) });
  const wa = display.workArea;
  const width = 392;
  const height = 158;
  win.setBounds({
    x: Math.round(wa.x + wa.width - width - 20),
    y: Math.round(wa.y + wa.height - height - 20),
    width,
    height
  });
  return win;
}

function sendStatus(payload) {
  lastStatus = payload;
  if (status && !status.isDestroyed()) status.webContents.send('desktop:status', payload);
}

function showStatus(payload, autoHide = 0) {
  clearTimeout(statusTimer);
  const win = placeStatus();
  sendStatus(payload);
  if (!win.isVisible()) win.showInactive();
  win.moveTop();
  if (autoHide > 0) statusTimer = setTimeout(() => hideStatus(), autoHide);
}

function hideStatus() {
  clearTimeout(statusTimer);
  if (status && !status.isDestroyed()) status.hide();
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function baseName(filePath) {
  return path.basename(String(filePath || ''));
}

function defaultOptions(tool) {
  const out = {};
  const groups = tool && tool.options ? tool.options : {};
  for (const list of Object.values(groups)) {
    if (!Array.isArray(list)) continue;
    for (const opt of list) {
      if (!opt || !opt.key) continue;
      if (opt.type === 'segmented') {
        const first = Array.isArray(opt.options) && opt.options.length ? opt.options[0] : null;
        out[opt.key] = opt.value !== undefined ? opt.value : (first ? first.value : '');
      } else if (opt.type === 'number') {
        out[opt.key] = opt.value !== undefined ? opt.value : (opt.min !== undefined ? opt.min : 0);
      } else if (opt.type === 'toggle') {
        out[opt.key] = opt.value !== undefined ? opt.value : false;
      } else if (opt.type === 'files') {
        out[opt.key] = [];
      } else if (opt.type === 'text') {
        out[opt.key] = opt.value !== undefined ? opt.value : '';
      } else if (opt.value !== undefined) {
        out[opt.key] = opt.value;
      }
    }
  }
  return out;
}

async function desktopConvert(paths, targetExt) {
  const ext = String(targetExt || '').toLowerCase();
  if (!paths.length) return { ok: false, error: 'No files were dropped.' };
  if (!ext) return { ok: false, error: 'No output format was chosen.' };
  if (busy) return { ok: false, busy: true, error: 'Another desktop job is still running. Wait for it to finish, then try again.' };
  busy = true;
  const total = paths.length;
  showStatus({ state: 'working', title: total > 1 ? `Converting ${total} files` : 'Converting file', subtitle: `${baseName(paths[0])} → ${ext.toUpperCase()}`, progress: 0 });
  const outputs = [];
  try {
    for (let i = 0; i < total; i += 1) {
      const input = paths[i];
      const result = await engine.convert(input, ext, { forceBeside: true }, (pct) => {
        const overall = total > 1 ? ((i + (clampPercent(pct) / 100)) / total) * 100 : clampPercent(pct);
        sendStatus({ state: 'working', title: total > 1 ? `Converting ${i + 1} of ${total}` : 'Converting file', subtitle: `${baseName(input)} → ${ext.toUpperCase()}`, progress: clampPercent(overall) });
      });
      outputs.push(result.output);
    }
    const last = outputs[outputs.length - 1];
    showStatus({
      state: 'done',
      title: total > 1 ? `${total} files converted` : 'Converted',
      subtitle: `${baseName(paths[0])} → ${ext.toUpperCase()}`,
      output: last,
      detail: total > 1 ? `${total} new files are beside the originals.` : 'Saved beside the original. Your source file was not changed.'
    }, 9000);
    return { ok: true, outputs };
  } catch (err) {
    const message = err && err.message ? err.message : 'Conversion failed.';
    showStatus({ state: 'error', title: 'Could not convert', subtitle: baseName(paths[0]), error: message, setup: Boolean(err && (err.code === 'MISSING_TOOL' || /required|install/i.test(message))) }, 14000);
    return { ok: false, error: message, code: err && err.code ? err.code : 'ERROR' };
  } finally {
    busy = false;
  }
}

async function desktopTool(paths, toolId) {
  const tool = (registry.TOOLS || []).find((t) => t.id === toolId);
  if (!tool) return { ok: false, error: 'That tool is not available.' };
  if (!paths.length) return { ok: false, error: 'No files were dropped.' };
  if (busy) return { ok: false, busy: true, error: 'Another desktop job is still running. Wait for it to finish, then try again.' };
  const target = paths[0];
  const options = defaultOptions(tool);
  busy = true;
  showStatus({ state: 'working', title: tool.name, subtitle: baseName(target), progress: 0 });
  try {
    const result = await engine.runTool(target, tool.id, options, { forceBeside: true }, (pct) => {
      sendStatus({ state: 'working', title: tool.name, subtitle: baseName(target), progress: clampPercent(pct) });
    });
    showStatus({ state: 'done', title: `${tool.name} finished`, subtitle: baseName(result.output), output: result.output, detail: 'Saved beside the original.' }, 9000);
    return { ok: true, output: result.output };
  } catch (err) {
    const message = err && err.message ? err.message : `${tool.name} failed.`;
    showStatus({ state: 'error', title: `${tool.name} failed`, subtitle: baseName(target), error: message, setup: Boolean(err && (err.code === 'MISSING_TOOL' || /required|install/i.test(message))) }, 14000);
    return { ok: false, error: message, code: err && err.code ? err.code : 'ERROR' };
  } finally {
    busy = false;
  }
}

function register() {
  ipcMain.handle('desktop:convert', (_event, payload) => {
    const data = payload || {};
    return desktopConvert(Array.isArray(data.paths) ? data.paths.filter(Boolean) : [], data.target);
  });

  ipcMain.handle('desktop:tool', (_event, payload) => {
    const data = payload || {};
    return desktopTool(Array.isArray(data.paths) ? data.paths.filter(Boolean) : [], data.toolId);
  });

  ipcMain.handle('desktop:hide', () => { hideOverlay(); return true; });
  ipcMain.handle('desktop:status-close', () => { hideStatus(); return true; });
  ipcMain.handle('desktop:notify', (_event, payload) => {
    const data = payload || {};
    showStatus({
      state: data.state || 'done',
      title: data.title || 'Done',
      subtitle: data.subtitle || '',
      output: data.output || '',
      detail: data.detail || '',
      error: data.error || '',
      setup: Boolean(data.setup)
    }, data.state === 'error' ? 14000 : 8000);
    return true;
  });
  ipcMain.handle('desktop:open-settings', () => {
    app.emit('wheelandform:open-settings');
    return true;
  });
  ipcMain.handle('desktop:busy', () => busy);
}

function dispose() {
  disposed = true;
  clearTimeout(hideTimer);
  clearTimeout(statusTimer);
  stopHelper();
  if (overlay && !overlay.isDestroyed()) overlay.destroy();
  if (status && !status.isDestroyed()) status.destroy();
  overlay = null;
  status = null;
}

module.exports = {
  register,
  refresh,
  setEnabled,
  dispose,
  hideOverlay,
  hideStatus
};
