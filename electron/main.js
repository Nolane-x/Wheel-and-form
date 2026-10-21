'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, nativeImage, clipboard, Menu, Tray } = require('electron');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');

const settings = require('./settings');
const registry = require('./converter/registry');
const engine = require('./converter/engine');
const desktop = require('./desktop');

let mainWindow = null;
let floatWindow = null;
let installProcess = null;
let tray = null;
let isQuitting = false;

const APP_NAME = 'Wheel and Form';
const isDev = process.argv.includes('--dev');

app.setName(APP_NAME);
app.setAppUserModelId('com.wheelandform.app');

function migrateLegacySettings() {
  const target = path.join(app.getPath('userData'), 'settings.json');
  if (fs.existsSync(target)) return;
  const appData = app.getPath('appData');
  const candidates = [
    path.join(appData, 'tangerine-clone', 'settings.json'),
    path.join(appData, 'Tangerine', 'settings.json'),
    path.join(appData, 'tangerine', 'settings.json')
  ];
  const source = candidates.find((candidate) => fs.existsSync(candidate));
  if (!source) return;
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    console.log(`[Wheel and Form] migrated settings from ${source}`);
  } catch (err) {
    console.error('[Wheel and Form] settings migration failed', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 940,
    minHeight: 640,
    show: false,
    frame: false,
    backgroundColor: '#E9EBE3',
    title: APP_NAME,
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });
  mainWindow.webContents.once('did-finish-load', () => {
    if (!isQuitting && !mainWindow.isVisible()) mainWindow.show();
  });
  mainWindow.on('maximize', () => mainWindow.webContents.send('window:state', { maximized: true }));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:state', { maximized: false }));
  mainWindow.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow.hide();
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    }
  });
}

const lock = app.requestSingleInstanceLock();
if (!lock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    migrateLegacySettings();
    desktop.register();
    desktop.refresh();
    createWindow();
    createTray();
    app.on('activate', () => {
      if (!mainWindow) createWindow();
      else showMainWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (!tray && process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
  desktop.dispose();
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

app.on('wheelandform:open-settings', () => {
  showMainWindow();
  setTimeout(() => mainWindow?.webContents.send('wheelandform:open-settings'), 250);
});

function showMainWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: 'Open Wheel and Form', click: showMainWindow },
    { type: 'separator' },
    {
      label: 'Desktop wheel',
      type: 'checkbox',
      checked: Boolean(settings.get().desktopWheel),
      click: (item) => {
        desktop.setEnabled(item.checked);
        refreshTrayMenu();
      }
    },
    {
      label: 'Settings…',
      click: () => {
        showMainWindow();
        setTimeout(() => mainWindow?.webContents.send('wheelandform:open-settings'), 250);
      }
    },
    { type: 'separator' },
    {
      label: 'Quit Wheel and Form',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
}

function refreshTrayMenu() {
  if (tray) tray.setContextMenu(buildTrayMenu());
}

function createTray() {
  if (tray) return;
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Wheel and Form — local file workshop');
  tray.setContextMenu(buildTrayMenu());
  tray.on('click', showMainWindow);
}

// ---------------------------------------------------------------------------
// Window controls
// ---------------------------------------------------------------------------

ipcMain.handle('window:minimize', () => { mainWindow?.minimize(); });
ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
  return mainWindow.isMaximized();
});
ipcMain.handle('window:close', () => { mainWindow?.close(); });
ipcMain.handle('window:is-maximized', () => Boolean(mainWindow?.isMaximized()));

// ---------------------------------------------------------------------------
// App / registry / settings
// ---------------------------------------------------------------------------

ipcMain.handle('app:info', () => ({
  name: APP_NAME,
  version: app.getVersion(),
  platform: process.platform,
  electron: process.versions.electron,
  userData: app.getPath('userData')
}));

ipcMain.handle('registry:get', () => ({
  conversions: registry.conversions.map((c) => ({
    id: c.id,
    inputExt: c.inputExt,
    outputExt: c.outputExt,
    category: c.category,
    label: c.label,
    note: c.note || ''
  })),
  conversionCount: registry.conversions.length,
  formats: registry.FORMAT_INFO,
  categories: registry.CATEGORY_META,
  categoryExts: registry.CATEGORY_EXTS,
  tools: registry.TOOLS,
  actions: registry.ACTIONS,
  importNotes: registry.IMPORT_NOTES
}));

ipcMain.handle('settings:get', () => settings.get());
ipcMain.handle('settings:set', (e, patch) => {
  const next = settings.set(patch || {});
  if (patch && Object.prototype.hasOwnProperty.call(patch, 'desktopWheel')) {
    desktop.refresh();
    refreshTrayMenu();
  }
  return next;
});
ipcMain.handle('settings:pick-folder', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose an output folder',
    properties: ['openDirectory', 'createDirectory']
  });
  if (res.canceled || !res.filePaths.length) return null;
  return res.filePaths[0];
});

// ---------------------------------------------------------------------------
// Engine status + setup
// ---------------------------------------------------------------------------

ipcMain.handle('tools:status', () => engine.getToolStatus());
ipcMain.handle('tools:refresh', () => engine.refreshTools());

ipcMain.handle('tools:install', async (e, name) => {
  const args = engine.wingetArgsFor(name);
  if (!args) return { ok: false, error: 'This engine cannot be installed automatically.' };
  if (installProcess) return { ok: false, error: 'Another installation is already running.' };
  return new Promise((resolve) => {
    let output = '';
    installProcess = spawn('winget.exe', args, { windowsHide: true });
    installProcess.stdout.on('data', (d) => {
      const text = d.toString();
      output += text;
      mainWindow?.webContents.send('tools:install-output', { tool: name, text });
    });
    installProcess.stderr.on('data', (d) => {
      const text = d.toString();
      output += text;
      mainWindow?.webContents.send('tools:install-output', { tool: name, text });
    });
    installProcess.on('error', (err) => {
      installProcess = null;
      resolve({ ok: false, error: `winget could not start: ${err.message}` });
    });
    installProcess.on('close', (code) => {
      installProcess = null;
      engine.refreshTools();
      resolve({ ok: code === 0, code, output, status: engine.getToolStatus() });
    });
  });
});

ipcMain.handle('tools:locate', async (e, name) => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: `Locate ${engine.TOOL_LABELS[name] || name}`,
    properties: ['openFile'],
    filters: [{ name: 'Executable', extensions: ['exe'] }]
  });
  if (res.canceled || !res.filePaths.length) return { ok: false };
  settings.set({ toolPaths: { [name]: res.filePaths[0] } });
  const status = engine.refreshTools();
  return { ok: true, path: res.filePaths[0], status };
});

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

ipcMain.handle('file:probe', async (e, filePath) => {
  try {
    return await engine.probe(String(filePath));
  } catch (err) {
    return { error: err.message, path: filePath, name: path.basename(String(filePath)) };
  }
});

ipcMain.handle('file:thumb', async (e, filePath, size) => {
  try {
    const stat = await fsp.stat(filePath);
    if (stat.isDirectory()) return null;
    if (stat.size > 60 * 1024 * 1024) return null;
    const edge = Math.max(64, Math.min(1024, Number(size) || 104));
    const img = await nativeImage.createThumbnailFromPath(filePath, { width: edge, height: edge });
    if (!img || img.isEmpty()) return null;
    return img.toDataURL();
  } catch {
    return null;
  }
});

function filtersFor(kind) {
  const exts = registry.CATEGORY_EXTS[kind] || [];
  if (!exts.length) return [{ name: 'All files', extensions: ['*'] }];
  return [{ name: `${kind[0].toUpperCase()}${kind.slice(1)}`, extensions: exts }];
}

ipcMain.handle('file:pick', async (e, opts = {}) => {
  const wantsFolder = opts.mode === 'folders' || String(opts.ext || '').toLowerCase() === 'folder';
  const mode = wantsFolder ? 'openDirectory' : 'openFile';
  const properties = mode === 'openDirectory' ? ['openDirectory', 'multiSelections'] : ['openFile', 'multiSelections'];
  const ext = String(opts.ext || '').replace(/^\./, '').toLowerCase();
  let filters = [];
  if (mode !== 'openDirectory') {
    if (ext) {
      filters = [
        { name: `${ext.toUpperCase()} files`, extensions: [ext] },
        { name: 'All files', extensions: ['*'] }
      ];
    } else if (opts.kind) {
      filters = filtersFor(opts.kind);
    } else {
      filters = [
        { name: 'All supported files', extensions: Object.keys(registry.FORMAT_INFO).filter((k) => k !== 'folder') },
        { name: 'All files', extensions: ['*'] }
      ];
    }
  }
  const res = await dialog.showOpenDialog(mainWindow, { title: opts.title || 'Choose a file', properties, filters });
  if (res.canceled) return [];
  return res.filePaths;
});

ipcMain.handle('file:extra', async (e, kind) => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Add files',
    properties: ['openFile', 'multiSelections'],
    filters: filtersFor(kind)
  });
  if (res.canceled) return [];
  return res.filePaths;
});

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

ipcMain.handle('file:copy', async (e, filePath) => {
  if (process.platform !== 'win32') {
    clipboard.writeText(filePath);
    return { ok: true };
  }
  const script = [
    'Add-Type -AssemblyName System.Windows.Forms',
    '$c = New-Object System.Collections.Specialized.StringCollection',
    `$c.Add(${psQuote(filePath)})`,
    '[System.Windows.Forms.Clipboard]::SetFileDropList($c)'
  ].join('; ');
  return new Promise((resolve) => {
    const child = spawn('powershell.exe', ['-NoProfile', '-STA', '-Command', script], { windowsHide: true });
    child.on('error', (err) => resolve({ ok: false, error: err.message }));
    child.on('close', (code) => resolve({ ok: code === 0 }));
  });
});

ipcMain.handle('file:duplicate', async (e, filePath) => {
  try {
    const stat = await fsp.stat(filePath);
    const isDir = stat.isDirectory();
    const dir = path.dirname(filePath);
    const ext = isDir ? '' : path.extname(filePath);
    const base = isDir ? path.basename(filePath) : path.basename(filePath, ext);
    let target = path.join(dir, `${base} copy${ext}`);
    let n = 2;
    while (fs.existsSync(target)) {
      target = path.join(dir, `${base} copy ${n}${ext}`);
      n++;
    }
    await fsp.cp(filePath, target, { recursive: true, errorOnExist: true, force: false });
    return { ok: true, path: target };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('file:copy-path', (e, filePath) => {
  clipboard.writeText(filePath);
  return { ok: true };
});

ipcMain.handle('file:reveal', (e, filePath) => {
  shell.showItemInFolder(filePath);
  return { ok: true };
});

ipcMain.handle('file:open', async (e, filePath) => {
  const err = await shell.openPath(filePath);
  return { ok: !err, error: err || null };
});

ipcMain.handle('file:move', async (e, filePath) => {
  const parent = mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() ? mainWindow : null;
  const res = await dialog.showOpenDialog(parent, {
    title: 'Move to folder',
    properties: ['openDirectory', 'createDirectory']
  });
  if (res.canceled || !res.filePaths.length) return { ok: false, cancelled: true };
  const dir = res.filePaths[0];
  let target = path.join(dir, path.basename(filePath));
  if (fs.existsSync(target)) {
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    let n = 2;
    do {
      target = path.join(dir, `${base} (${n})${ext}`);
      n++;
    } while (fs.existsSync(target));
  }
  try {
    await fsp.rename(filePath, target);
  } catch (err) {
    if (err.code === 'EXDEV') {
      await fsp.cp(filePath, target, { recursive: true });
      await fsp.rm(filePath, { recursive: true, force: true });
    } else {
      throw err;
    }
  }
  return { ok: true, path: target, folder: dir };
});

ipcMain.handle('file:terminal', (e, filePath) => {
  const dir = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory() ? filePath : path.dirname(filePath);
  try {
    const child = spawn('wt.exe', ['-d', dir], { detached: true, stdio: 'ignore', windowsHide: false });
    child.on('error', () => {
      spawn('powershell.exe', ['-NoExit', '-Command', `Set-Location -LiteralPath ${psQuote(dir)}`], { detached: true, stdio: 'ignore', windowsHide: false });
    });
    child.unref();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('file:show-in-folder', (e, filePath) => {
  shell.showItemInFolder(filePath);
  return { ok: true };
});

ipcMain.handle('app:open-external', (e, url) => {
  if (!/^https?:\/\//i.test(String(url))) return { ok: false };
  shell.openExternal(String(url));
  return { ok: true };
});

// ---------------------------------------------------------------------------
// Floating preview
// ---------------------------------------------------------------------------

ipcMain.handle('float:show', async (e, filePath) => {
  if (floatWindow && !floatWindow.isDestroyed()) {
    floatWindow.close();
    floatWindow = null;
  }
  let stat;
  try {
    stat = await fsp.stat(filePath);
  } catch {
    return { ok: false, error: 'File not found.' };
  }
  const isImage = !stat.isDirectory() && /\.(jpe?g|png|gif|webp|bmp|avif|svg)$/i.test(filePath);
  const isVideo = !stat.isDirectory() && /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(filePath);
  const isAudio = !stat.isDirectory() && /\.(mp3|m4a|wav|flac|ogg|opus|aiff|wma)$/i.test(filePath);
  floatWindow = new BrowserWindow({
    width: isVideo ? 440 : 380,
    height: isVideo ? 340 : isImage ? 420 : 260,
    minWidth: 260,
    minHeight: 180,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    backgroundColor: '#141514',
    title: `Float — ${path.basename(filePath)}`,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  floatWindow.setAlwaysOnTop(true, 'floating');
  floatWindow.loadFile(path.join(__dirname, '..', 'src', 'float.html'), {
    query: {
      file: filePath,
      mode: isImage ? 'image' : isVideo ? 'video' : isAudio ? 'audio' : stat.isDirectory() ? 'folder' : 'file',
      name: path.basename(filePath)
    }
  });
  floatWindow.on('closed', () => { floatWindow = null; });
  return { ok: true };
});

ipcMain.handle('float:close', () => {
  if (floatWindow && !floatWindow.isDestroyed()) floatWindow.close();
  return { ok: true };
});

// ---------------------------------------------------------------------------
// Conversions & tools
// ---------------------------------------------------------------------------

function contextForJob() {
  return {
    pickSavePath: async (suggested, ext) => {
      const res = await dialog.showSaveDialog(mainWindow, {
        title: 'Save converted file',
        defaultPath: suggested,
        filters: [{ name: ext.toUpperCase(), extensions: [ext] }]
      });
      return res.canceled ? null : res.filePath;
    }
  };
}

ipcMain.handle('convert:run', async (e, job = {}) => {
  const id = job.id || `job-${Date.now()}`;
  if (!job.input || !job.ext) return { ok: false, error: 'Missing file or target format.' };
  try {
    const result = await engine.convert(String(job.input), String(job.ext).toLowerCase(), contextForJob(), (percent) => {
      mainWindow?.webContents.send('job:progress', { id, percent });
    });
    return { ...result, id };
  } catch (err) {
    return { ok: false, error: err.message || 'Conversion failed.', code: err.code || 'ERROR', tool: err.tool || null, id };
  }
});

ipcMain.handle('tool:run', async (e, job = {}) => {
  const id = job.id || `tool-${Date.now()}`;
  if (!job.input || !job.toolId) return { ok: false, error: 'Missing file or tool.' };
  try {
    const result = await engine.runTool(String(job.input), String(job.toolId), job.options || {}, contextForJob(), (percent) => {
      mainWindow?.webContents.send('job:progress', { id, percent });
    });
    return { ...result, id };
  } catch (err) {
    return { ok: false, error: err.message || 'The tool could not finish.', code: err.code || 'ERROR', tool: err.tool || null, id };
  }
});

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

ipcMain.handle('app:clipboard-text', (e, text) => {
  clipboard.writeText(String(text));
  return { ok: true };
});

ipcMain.handle('app:open-settings-file', () => {
  const file = path.join(app.getPath('userData'), 'settings.json');
  shell.showItemInFolder(file);
  return { ok: true };
});
