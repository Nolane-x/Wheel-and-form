'use strict';

(function () {
  const api = window.api;
  const UI = window.UI;
  const $ = (sel, root = document) => root.querySelector(sel);

  const root = $('#deskRoot');
  const wheelLayer = $('#wheelLayer');
  const fileEl = $('#deskFile');
  const fileIconEl = $('#deskFileIcon');
  const fileNameEl = $('#deskFileName');
  const fileMetaEl = $('#deskFileMeta');

  let wheel = null;
  let registry = null;
  let mode = 'convert';
  let current = { name: '', ext: '', kind: '', size: 0 };
  let wheelOpen = false;
  let dropping = false;

  const SHORT = {
    compress: 'COMPRESS', removeMetadata: 'METADATA', editImage: 'EDIT', annotateImage: 'ANNOTATE',
    frameImage: 'ADD BG', cropImage: 'CROP', redactImage: 'REDACT', normalizeAudio: 'NORMALIZE',
    muteVideo: 'MUTE', trimVideo: 'TRIM', splitPDF: 'SPLIT', organizePDF: 'ORGANIZE',
    extractArchive: 'EXTRACT', createPDF: 'CREATE PDF', mergePDF: 'MERGE', cropVideo: 'CROP',
    changeVideoSpeed: 'SPEED', joinVideos: 'JOIN', videoSnapshots: 'SNAPSHOT', splitVideo: 'SPLIT',
    audioToVideo: 'VISUALIZE', trimAudio: 'TRIM', audioChannels: 'CHANNELS', redactAudio: 'BLEEP',
    redactVideo: 'REDACT', createCollage: 'COLLAGE'
  };

  function formatLabel(ext) {
    const info = registry && registry.formats ? registry.formats[ext] : null;
    return (info && info.label) || String(ext || '').toUpperCase() || 'File';
  }

  function categoryFor(ext) {
    const info = registry && registry.formats ? registry.formats[ext] : null;
    return (info && info.category) || (ext === 'folder' ? 'folder' : '');
  }

  function categoryLabel(kind) {
    const meta = registry && registry.categories ? registry.categories[kind] : null;
    return (meta && meta.label) || (kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : 'File');
  }

  function extOf(name) {
    const value = String(name || '');
    const index = value.lastIndexOf('.');
    if (index <= 0 || index === value.length - 1) return 'folder';
    return value.slice(index + 1).toLowerCase();
  }

  function baseName(value) {
    const name = String(value || '');
    const index = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
    return index >= 0 ? name.slice(index + 1) : name;
  }

  function uniqueTargets(ext) {
    const seen = new Set();
    const out = [];
    for (const row of registry.conversions || []) {
      if (row.inputExt !== ext) continue;
      const target = row.outputExt;
      if (!target || seen.has(target)) continue;
      seen.add(target);
      out.push(row);
    }
    return out;
  }

  function toolsFor(kind) {
    return (registry.tools || []).filter((tool) => Array.isArray(tool.kinds) && tool.kinds.includes(kind));
  }

  function modeOptions(nextMode) {
    if (nextMode === 'convert') {
      const targets = uniqueTargets(current.ext);
      if (!targets.length) return null;
      return targets.map((row) => ({
        id: row.outputExt,
        label: formatLabel(row.outputExt),
        short: formatLabel(row.outputExt),
        desc: `Convert to <strong>${escapeHtml(formatLabel(row.outputExt))}</strong>${row.note ? ` · <span class="detail-key">${escapeHtml(row.note)}</span>` : ''}`,
        hubIcon: UI.fileIcon(row.outputExt, 31),
        hubSub: 'output'
      }));
    }
    if (nextMode === 'tools') {
      const tools = toolsFor(current.kind);
      if (!tools.length) return null;
      return tools.map((tool) => ({
        id: tool.id,
        label: tool.name,
        short: SHORT[tool.id] || String(tool.name || '').toUpperCase(),
        desc: `<strong>${escapeHtml(tool.name)}</strong> · ${escapeHtml(tool.desc || '')}`,
        hubIcon: `<img src="${UI.toolIcon(tool.id)}" alt="">`,
        hubSub: 'tool'
      }));
    }
    return (registry.actions || []).map((action) => ({
      id: action.id,
      label: action.name,
      short: action.title || action.name,
      desc: `<strong>${escapeHtml(action.name)}</strong> · ${escapeHtml(action.desc || '')}`,
      hubIcon: UI.icon(action.icon, 25),
      hubSub: 'action'
    }));
  }

  function escapeHtml(value) {
    if (UI && UI.escapeHtml) return UI.escapeHtml(value);
    return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function setPoint(x, y) {
    const marginX = 188;
    const marginTop = 222;
    const marginBottom = 238;
    const wx = Math.max(marginX, Math.min(window.innerWidth - marginX, x));
    const wy = Math.max(marginTop, Math.min(window.innerHeight - marginBottom, y));
    root.style.setProperty('--wx', `${Math.round(wx)}px`);
    root.style.setProperty('--wy', `${Math.round(wy)}px`);
  }

  function showFile() {
    if (!current.name) {
      fileEl.hidden = true;
      return;
    }
    fileEl.hidden = false;
    fileIconEl.innerHTML = current.ext ? UI.fileIcon(current.ext, 26) : UI.icon('file', 24);
    fileNameEl.textContent = current.name;
    const bits = [categoryLabel(current.kind || categoryFor(current.ext))];
    if (mode === 'tools') bits.push('Tools');
    else if (mode === 'actions') bits.push('Actions');
    else bits.push('Formats');
    fileMetaEl.textContent = bits.join(' · ');
  }

  function chooseMode(force) {
    const targets = uniqueTargets(current.ext);
    const tools = toolsFor(current.kind);
    if (mode === 'convert' && !targets.length && tools.length) mode = 'tools';
    if (mode === 'tools' && !tools.length) mode = targets.length ? 'convert' : 'actions';
    if (mode === 'convert' && !targets.length && !tools.length) mode = 'actions';
    if (force) mode = force;
  }

  function openWheel() {
    if (!current.name || !registry) return;
    chooseMode();
    const options = modeOptions(mode);
    if (!options || !options.length) {
      wheelLayer.style.visibility = 'hidden';
      wheelOpen = false;
      return;
    }
    wheelLayer.style.visibility = 'visible';
    wheelOpen = true;
    const count = options.length;
    wheel.open({
      kicker: `${categoryLabel(current.kind || categoryFor(current.ext))} · ${formatLabel(current.ext)}`,
      title: 'Release to choose',
      subtitle: current.name,
      detail: '',
      options,
      index: 0,
      tabs: [
        { id: 'convert', label: 'Formats' },
        { id: 'tools', label: 'Tools' },
        { id: 'actions', label: 'Actions' }
      ],
      mode,
      dragMode: true,
      onSelect: (option) => runChoice(option),
      onTab: (next) => switchMode(next)
    });
    wheel.setActiveMode(mode);
    showFile();
  }

  function switchMode(next) {
    if (!next || next === mode) return;
    if (next === 'convert' && !uniqueTargets(current.ext).length) return;
    if (next === 'tools' && !toolsFor(current.kind).length) return;
    mode = next;
    showFile();
    openWheel();
  }

  async function runChoice(option) {
    if (!option || dropping) return;
    dropping = true;
    const files = await pendingFiles;
    const paths = files.filter(Boolean);
    if (!paths.length) {
      dropping = false;
      api.desktop.hide();
      return;
    }
    api.desktop.hide();
    if (mode === 'convert') {
      const res = await api.desktop.convert({ paths, target: option.id }).catch((err) => ({ ok: false, error: err.message }));
      if (!res.ok && res.error) api.desktop.notify({ state: 'error', title: 'Could not convert', error: res.error, setup: /required|install/i.test(res.error) });
    } else if (mode === 'tools') {
      const res = await api.desktop.tool({ paths, toolId: option.id }).catch((err) => ({ ok: false, error: err.message }));
      if (!res.ok && res.error) api.desktop.notify({ state: 'error', title: 'Tool failed', error: res.error, setup: /required|install/i.test(res.error) });
    } else {
      await runAction(paths[0], option.id);
    }
    dropping = false;
  }

  async function runAction(filePath, actionId) {
    const name = baseName(filePath);
    try {
      if (actionId === 'airdrop') {
        const res = await api.file.copy(filePath);
        if (res.ok) api.desktop.notify({ title: 'File copied', subtitle: name, detail: 'Paste it into any app.' });
        else api.desktop.notify({ state: 'error', title: 'Could not copy', error: res.error || 'Copy failed.' });
      } else if (actionId === 'float') {
        await api.float.show(filePath);
      } else if (actionId === 'copy') {
        const res = await api.file.duplicate(filePath);
        if (res.ok) api.desktop.notify({ title: 'Copy created', subtitle: baseName(res.path), output: res.path, detail: 'Saved beside the original.' });
        else api.desktop.notify({ state: 'error', title: 'Could not duplicate', error: res.error || 'Duplicate failed.' });
      } else if (actionId === 'move') {
        const res = await api.file.move(filePath);
        if (res.ok) api.desktop.notify({ title: 'File moved', subtitle: baseName(res.path), output: res.path, detail: 'Moved to the folder you picked.' });
      } else if (actionId === 'copyPath') {
        await api.app.clipboardText(filePath);
        api.desktop.notify({ title: 'Path copied', subtitle: name, detail: 'The full path is on your clipboard.' });
      } else if (actionId === 'openTerminal') {
        await api.file.terminal(filePath);
        api.desktop.notify({ title: 'Terminal opened', subtitle: name, detail: 'Starting in the file’s folder.' });
      }
    } catch (err) {
      api.desktop.notify({ state: 'error', title: 'Action failed', error: err.message || 'Something went wrong.' });
    }
  }

  let pendingFiles = Promise.resolve([]);

  function filesFromTransfer(dataTransfer) {
    const files = [];
    if (!dataTransfer) return files;
    const list = dataTransfer.files;
    if (list && list.length) {
      for (let i = 0; i < list.length; i += 1) {
        const file = list[i];
        try {
          const filePath = api.getPathForFile(file) || file.path;
          if (filePath) files.push(filePath);
        } catch (_) { /* ignore */ }
      }
    }
    return files;
  }

  function previewFromTransfer(dataTransfer) {
    if (!dataTransfer) return null;
    const items = dataTransfer.items;
    if (!items || !items.length) return null;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].kind !== 'file') continue;
      const file = items[i].getAsFile();
      if (file) return file;
    }
    return null;
  }

  function onDragEnter(event) {
    event.preventDefault();
    const file = previewFromTransfer(event.dataTransfer);
    if (!file) return;
    const ext = extOf(file.name);
    const kind = ext === 'folder' ? 'folder' : categoryFor(ext);
    if (current.name !== file.name) {
      current = { name: file.name, ext, kind, size: file.size || 0 };
      pendingFiles = Promise.resolve([]);
      showFile();
      openWheel();
    }
  }

  function onDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    try { event.dataTransfer.dropEffect = 'copy'; } catch (_) { /* ignore */ }
    if (!wheelOpen) {
      const file = previewFromTransfer(event.dataTransfer);
      if (file) {
        const ext = extOf(file.name);
        current = { name: file.name, ext, kind: ext === 'folder' ? 'folder' : categoryFor(ext), size: file.size || 0 };
        showFile();
        openWheel();
      }
      return;
    }
    wheel.hoverAt(event.clientX, event.clientY);
  }

  function onDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const paths = filesFromTransfer(event.dataTransfer);
    if (!paths.length) {
      api.desktop.hide();
      return;
    }
    pendingFiles = Promise.resolve(paths);
    if (!wheelOpen) {
      api.desktop.hide();
      return;
    }
    let index = wheel.hitTest(event.clientX, event.clientY);
    if (index < 0 && wheel.inside(event.clientX, event.clientY)) index = wheel.index;
    if (index < 0) {
      api.desktop.hide();
      return;
    }
    const option = (window.__deskOptions || [])[index];
    if (!option) {
      api.desktop.hide();
      return;
    }
    runChoice(option);
  }

  // Wheel keeps its own options internally; mirror the array for drop selection.
  const originalOpen = window.Wheel && window.Wheel.prototype ? window.Wheel.prototype.open : null;

  function patchWheel() {
    if (originalOpen && !window.Wheel.prototype.__deskp) {
      window.Wheel.prototype.open = function open(model) {
        window.__deskOptions = (model && model.options) || [];
        return originalOpen.call(this, model);
      };
      window.Wheel.prototype.__deskp = true;
    }
  }

  function onShow(payload) {
    mode = payload && payload.mode ? payload.mode : 'convert';
    setPoint(payload.x || 0, payload.y || 0);
    current = { name: '', ext: '', kind: '', size: 0 };
    pendingFiles = Promise.resolve([]);
    wheelLayer.style.visibility = 'hidden';
    wheelOpen = false;
    showFile();
  }

  function onMove(payload) {
    if (!payload) return;
    setPoint(payload.x, payload.y);
  }

  function onMode(payload) {
    if (!payload || !payload.mode || !current.name) return;
    switchMode(payload.mode);
  }

  function boot() {
    wheel = new window.Wheel(wheelLayer);
    patchWheel();
    api.registry.get().then((data) => {
      registry = data;
    }).catch(() => {});

    window.addEventListener('dragenter', onDragEnter, true);
    window.addEventListener('dragover', onDragOver, true);
    window.addEventListener('drop', onDrop, true);
    window.addEventListener('dragend', () => { api.desktop.hide(); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') api.desktop.hide();
    });

    api.desktop.onShow(onShow);
    api.desktop.onMove(onMove);
    api.desktop.onMode(onMode);
    api.desktop.onCancel(() => api.desktop.hide());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
