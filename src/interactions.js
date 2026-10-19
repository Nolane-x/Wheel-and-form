'use strict';

(function () {
  const U = window.UI;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const api = window.api;
  const A = () => window.App;

  // ------------------------------------------------------------------ toasts

  function toast(message, type = 'success', action = null) {
    const root = $('#toastRoot');
    if (!root) return;
    while (root.children.length >= 3) root.removeChild(root.firstChild);
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const iconName = type === 'error' ? 'alert' : type === 'info' ? 'info' : 'checkCircle';
    el.innerHTML = `${U.icon(iconName, 15)}<span>${U.escapeHtml(message)}</span>`;
    if (action && action.label) {
      const btn = document.createElement('button');
      btn.className = 'toast-action';
      btn.type = 'button';
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        try { action.action(); } catch { /* ignore */ }
        dismiss();
      });
      el.appendChild(btn);
    }
    root.appendChild(el);
    let timer = setTimeout(dismiss, 5200);
    el.addEventListener('mouseenter', () => clearTimeout(timer));
    el.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 2600); });
    function dismiss() {
      clearTimeout(timer);
      if (!el.isConnected) return;
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 200);
    }
  }

  // ------------------------------------------------------------------ modals

  function openModal(html) {
    const root = $('#modalRoot');
    root.innerHTML = `<div class="modal-scrim" data-close></div>${html}`;
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add('is-open'));
  }

  function closeModal() {
    const root = $('#modalRoot');
    if (!root || root.hidden) return;
    root.classList.remove('is-open');
    root.hidden = true;
    root.innerHTML = '';
    if (window.App) {
      window.App.state.activeToolJob = null;
      window.App.state.toolModal = null;
      window.App.state.installing = null;
    }
  }

  function hydrateIcons(root = document) {
    $$('[data-icon]', root).forEach((el) => {
      const name = el.dataset.icon;
      const size = Number(el.dataset.size) || 18;
      el.innerHTML = U.icon(name, size);
    });
  }

  // ------------------------------------------------------------------- wheel

  function findTool(id) {
    return (A().state.registry.tools || []).find((t) => t.id === id) || null;
  }

  function buildWheelModel(entry, mode, dragMode) {
    const app = A();
    if (!entry) return null;
    const info = entry.info;
    const kind = info.kind;
    if (mode === 'convert') {
      const targets = app.targetsForEntry(entry);
      if (!targets.length) {
        toast(`No conversions available for ${U.baseName(entry.info.name)}.`, 'info');
        return null;
      }
      const options = targets.map((t) => ({
        id: t.ext,
        label: app.formatLabel(t.ext),
        short: app.formatLabel(t.ext),
        desc: `Convert to <strong>${app.formatLabel(t.ext)}</strong>${t.note ? ` · <span class="detail-key">${U.escapeHtml(t.note)}</span>` : ''}`,
        hubIcon: U.fileIcon(t.ext, 31),
        hubSub: 'output'
      }));
      return {
        kicker: `${app.categoryLabel(kind)} · ${app.formatLabel(info.ext)}`,
        title: dragMode ? 'Release to convert' : 'Pick a format',
        subtitle: dragMode ? (entry.info.name || 'Your file') : `${entry.info.name}${info.size ? ` · ${U.fmtBytes(info.size)}` : ''}`,
        options,
        index: Math.max(0, targets.findIndex((t) => t.ext === entry.target)),
        mode
      };
    }
    if (mode === 'tools') {
      const tools = (app.state.registry.tools || []).filter((t) => t.kinds.includes(kind));
      if (!tools.length) {
        toast(`No tools for ${app.categoryLabel(kind)} files yet.`, 'info');
        return null;
      }
      return {
        kicker: `TOOLS · ${app.categoryLabel(kind)}`,
        title: dragMode ? 'Release to open a tool' : 'Pick a tool',
        subtitle: entry.info.name,
        options: tools.map((tool) => ({
          id: tool.id,
          label: tool.name,
          short: shortTool(tool),
          desc: `<strong>${U.escapeHtml(tool.name)}</strong> · ${U.escapeHtml(tool.desc)}`,
          hubIcon: `<img src="${U.toolIcon(tool.id)}" alt="">`,
          hubSub: 'tool'
        })),
        index: 0,
        mode
      };
    }
    const actions = app.state.registry.actions || [];
    return {
      kicker: 'FILE ACTIONS',
      title: dragMode ? 'Release to act' : 'What next?',
      subtitle: entry.info.name,
      options: actions.map((action) => ({
        id: action.id,
        label: action.name,
        short: action.title,
        desc: `<strong>${U.escapeHtml(action.name)}</strong> · ${U.escapeHtml(action.desc)}`,
        hubIcon: U.icon(action.icon, 25),
        hubSub: 'action'
      })),
      index: 0,
      mode: 'actions'
    };
  }

  function shortTool(tool) {
    const map = {
      compress: 'COMPRESS', removeMetadata: 'METADATA', editImage: 'EDIT', annotateImage: 'ANNOTATE',
      frameImage: 'ADD BG', cropImage: 'CROP', redactImage: 'REDACT', normalizeAudio: 'NORMALIZE',
      muteVideo: 'MUTE', trimVideo: 'TRIM', splitPDF: 'SPLIT', organizePDF: 'ORGANIZE',
      extractArchive: 'EXTRACT', createPDF: 'CREATE PDF', mergePDF: 'MERGE', cropVideo: 'CROP',
      changeVideoSpeed: 'SPEED', joinVideos: 'JOIN', videoSnapshots: 'SNAPSHOT', splitVideo: 'SPLIT',
      audioToVideo: 'VISUALIZE', trimAudio: 'TRIM', audioChannels: 'CHANNELS', redactAudio: 'BLEEP',
      redactVideo: 'REDACT', createCollage: 'COLLAGE'
    };
    return map[tool.id] || String(tool.name).toUpperCase();
  }

  function openWheel(entry, mode) {
    const app = A();
    const model = buildWheelModel(entry, mode, false);
    if (!model) return;
    app.state.wheelEntry = entry;
    app.state.wheelMode = mode;
    app.state.wheelDrag = false;
    app.state.wheelOptions = model.options;
    const tabs = [
      { id: 'convert', label: 'Formats' },
      { id: 'tools', label: 'Tools' },
      { id: 'actions', label: 'Actions' }
    ];
    window.__wheel.open({
      ...model,
      dragMode: false,
      tabs,
      onTab: (next) => {
        if (next === mode) return;
        openWheel(entry, next);
      },
      onSelect: (option) => {
        closeWheel();
        if (mode === 'convert') app.convertEntry(entry, option.id);
        else if (mode === 'tools') {
          const tool = findTool(option.id);
          if (tool && window.ToolUI) window.ToolUI.open(entry, tool);
        } else if (mode === 'actions') {
          runAction(entry, option.id);
        }
      }
    });
    window.__wheel.setActiveMode(mode);
  }

  function closeWheel() {
    if (window.__wheel) window.__wheel.close();
    const app = A();
    if (app) {
      app.state.wheelEntry = null;
      app.state.wheelMode = null;
      app.state.wheelDrag = false;
      app.state.wheelOptions = [];
    }
  }

  // ------------------------------------------------------------------ actions

  async function runAction(entry, actionId) {
    if (!entry || !entry.path) return;
    const app = A();
    const path = entry.path;
    const name = entry.info ? entry.info.name : U.baseName(path);
    try {
      if (actionId === 'airdrop') {
        const res = await api.file.copy(path);
        if (res.ok) toast('File copied. Paste it into any app.', 'success');
        else toast(res.error || 'Could not copy the file.', 'error');
      } else if (actionId === 'float') {
        const res = await api.float.show(path);
        if (res.ok) toast('Floating preview opened.', 'info');
        else toast(res.error || 'Could not open the preview.', 'error');
      } else if (actionId === 'copy') {
        const res = await api.file.duplicate(path);
        if (res.ok) {
          toast(`Created ${U.baseName(res.path)}`, 'success', { label: 'Show', action: () => api.file.reveal(res.path) });
          app.addActivity({ name, detail: `Duplicated as ${U.baseName(res.path)}`, status: 'done', output: res.path });
        } else toast(res.error || 'Could not duplicate the file.', 'error');
      } else if (actionId === 'move') {
        const res = await api.file.move(path);
        if (res.ok) {
          entry.path = res.path;
          const info = await api.file.probe(res.path).catch(() => null);
          if (info && !info.error) entry.info = info;
          app.renderQueue();
          app.addActivity({ name, detail: `Moved to ${U.baseName(res.folder)}`, status: 'done', output: res.path });
          toast(`Moved to ${U.baseName(res.folder)}`, 'success', { label: 'Show', action: () => api.file.reveal(res.path) });
        } else if (!res.cancelled) toast(res.error || 'Could not move the file.', 'error');
      } else if (actionId === 'copyPath') {
        await api.file.copyPath(path);
        toast('Full path copied to the clipboard.', 'success');
      } else if (actionId === 'openTerminal') {
        const res = await api.file.terminal(path);
        if (res.ok) toast('Terminal opened in that folder.', 'info');
        else toast(res.error || 'Could not open a terminal.', 'error');
      }
    } catch (err) {
      toast(err.message || 'That action failed.', 'error');
    }
  }

  // ---------------------------------------------------------------- drag/drop

  let drag = null;
  let dragKeys = { shift: false, ctrl: false, alt: false };
  let lastPoint = { x: 0, y: 0 };

  function hasFiles(event) {
    const dt = event.dataTransfer;
    if (!dt) return false;
    return Array.from(dt.types || []).includes('Files');
  }

  function kindFromMime(mime) {
    if (!mime) return 'other';
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    if (/zip|compressed|tar|gzip/.test(mime)) return 'archive';
    if (/text|word|document|rtf/.test(mime)) return 'document';
    return 'other';
  }

  function guessDrop(dt) {
    let file = null;
    try {
      for (const item of Array.from(dt.items || [])) {
        if (item.kind === 'file') { file = item.getAsFile(); break; }
      }
    } catch { /* ignore */ }
    const name = file && file.name ? file.name : '';
    const ext = U.extOf(name);
    let kind = ext ? A().categoryForExt(ext) : 'other';
    if (!ext || kind === 'other') {
      const mimeKind = kindFromMime(file && file.type);
      if (mimeKind !== 'other') kind = mimeKind;
    }
    if (!name && (!file || !file.type)) kind = 'folder';
    const guessedExt = ext || (A().DEFAULT_EXT[kind] || '');
    return { fileName: name || 'Your file', ext: guessedExt, kind };
  }

  function ghostIcon() {
    if (!drag) return '';
    if (drag.ext) return U.fileIcon(drag.ext, 27);
    const map = { image: 'image', video: 'film', audio: 'music', pdf: 'doc', document: 'doc', folder: 'folder' };
    return `<span class="file-icon generic" style="width:27px;height:27px">${U.icon(map[drag.kind] || 'file', 15)}</span>`;
  }

  function updateGhost(x, y) {
    const ghost = $('#dragGhost');
    if (!ghost || !drag) return;
    ghost.hidden = false;
    ghost.style.left = `${x}px`;
    ghost.style.top = `${y}px`;
    const nameEl = $('#dragGhostName');
    if (nameEl) nameEl.textContent = drag.fileName;
    const iconEl = $('#dragGhostIcon');
    if (iconEl && iconEl.dataset.kind !== `${drag.kind}:${drag.ext}`) {
      iconEl.innerHTML = ghostIcon();
      iconEl.dataset.kind = `${drag.kind}:${drag.ext}`;
    }
  }

  function applyDragMode(mode, event) {
    if (!drag) return;
    if (mode === drag.mode) {
      if (mode && event) window.__wheel.hoverAt(lastPoint.x, lastPoint.y);
      return;
    }
    drag.mode = mode;
    if (!mode) {
      closeWheel();
      const layer = $('#dropLayer');
      layer.hidden = false;
      layer.classList.add('is-open');
      return;
    }
    const app = A();
    const kind = drag.kind;
    if (kind === 'other') {
      const layer = $('#dropLayer');
      layer.hidden = false;
      layer.classList.add('is-open');
      drag.mode = null;
      return;
    }
    const ext = drag.ext || app.DEFAULT_EXT[kind] || 'pdf';
    const pseudo = {
      id: 'drag',
      path: '',
      target: null,
      info: {
        name: drag.fileName,
        ext,
        kind,
        isDir: kind === 'folder',
        size: 0,
        label: app.formatLabel(ext)
      }
    };
    const model = buildWheelModel(pseudo, mode, true);
    if (!model) {
      const layer = $('#dropLayer');
      layer.hidden = false;
      layer.classList.add('is-open');
      drag.mode = null;
      return;
    }
    drag.pseudo = pseudo;
    drag.options = model.options;
    $('#dropLayer').hidden = true;
    app.state.wheelEntry = pseudo;
    app.state.wheelMode = mode;
    app.state.wheelDrag = true;
    app.state.wheelOptions = model.options;
    window.__wheel.open({
      ...model,
      dragMode: true,
      tabs: [],
      onSelect: () => {},
      onTab: null
    });
    window.__wheel.setActiveMode(mode);
    if (event) window.__wheel.hoverAt(event.clientX, event.clientY);
  }

  function endDrag() {
    drag = null;
    dragKeys = { shift: false, ctrl: false, alt: false };
    closeWheel();
    const layer = $('#dropLayer');
    if (layer) {
      layer.hidden = true;
      layer.classList.remove('is-open');
    }
    const ghost = $('#dragGhost');
    if (ghost) ghost.hidden = true;
  }

  function pathsFromDrop(dt) {
    const paths = [];
    try {
      for (const file of Array.from(dt.files || [])) {
        const p = api.getPathForFile(file);
        if (p) paths.push(p);
      }
    } catch { /* ignore */ }
    return paths;
  }

  async function handleDrop(event) {
    event.preventDefault();
    if (!drag) return;
    const paths = pathsFromDrop(event.dataTransfer);
    const mode = drag.mode;
    const options = drag.options || [];
    let index = -1;
    if (mode) {
      index = window.__wheel.hitTest(event.clientX, event.clientY);
      if (index < 0 && window.__wheel.inside(event.clientX, event.clientY)) index = window.__wheel.index;
    }
    const option = index >= 0 ? options[index] : null;
    endDrag();
    if (!paths.length) return;
    const app = A();
    if (!mode || !option) {
      await app.addFiles(paths);
      return;
    }
    if (mode === 'convert') {
      const added = await app.addFiles(paths, { target: option.id });
      let queued = 0;
      for (const entry of added) {
        const targets = app.targetsForEntry(entry);
        if (targets.some((t) => t.ext === option.id)) {
          app.convertEntry(entry, option.id);
          queued++;
        } else {
          toast(`${entry.info.name} cannot become ${app.formatLabel(option.id)}.`, 'error');
        }
      }
      if (queued > 1) toast(`${queued} files queued for ${app.formatLabel(option.id)}.`, 'success');
    } else if (mode === 'tools') {
      const added = await app.addFiles(paths);
      const tool = findTool(option.id);
      const entry = added.find((e) => tool && tool.kinds.includes(e.info.kind));
      if (tool && entry) window.ToolUI.open(entry, tool);
      else if (tool) toast(`${tool.name} does not support the dropped file.`, 'error');
    } else if (mode === 'actions') {
      const added = await app.addFiles(paths);
      if (added[0]) runAction(added[0], option.id);
    }
  }

  function modeFromKeys(event) {
    if (event.shiftKey) return 'convert';
    if (event.ctrlKey) return 'tools';
    if (event.altKey) return 'actions';
    return null;
  }

  // ------------------------------------------------------------------ pickers

  async function pickForConversion(inputExt, outputExt) {
    const app = A();
    const kind = app.categoryForExt(inputExt);
    const paths = await api.file.pick({
      kind,
      ext: inputExt,
      title: `${app.formatLabel(inputExt)} → ${app.formatLabel(outputExt)}`
    });
    if (paths && paths.length) await app.addFiles(paths, { target: outputExt });
  }

  // ------------------------------------------------------------------- bind

  function bind() {
    const app = A();
    const ghost = $('#dragGhost');
    if (ghost) {
      document.body.appendChild(ghost);
      ghost.style.zIndex = '150';
    }

    // window controls
    $$('[data-win]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.win;
        if (action === 'close') api.window.close();
        else if (action === 'min') api.window.minimize();
        else api.window.maximize();
      });
    });
    api.window.onState(({ maximized }) => {
      const btn = document.querySelector('[data-win="max"]');
      if (btn) btn.title = maximized ? 'Restore' : 'Maximize';
    });
    const titlebar = $('#titlebar');
    if (titlebar) {
      titlebar.addEventListener('dblclick', (e) => {
        if (e.target.closest('button, .app-tabs, .engine-pill, .icon-btn')) return;
        api.window.maximize();
      });
    }

    // navigation
    $$('.app-tab').forEach((tab) => {
      tab.addEventListener('click', () => app.showView(tab.dataset.view));
    });
    $$('[data-go-tools]').forEach((btn) => btn.addEventListener('click', () => app.showView('tools')));
    $$('[data-go-formats]').forEach((btn) => btn.addEventListener('click', () => app.showView('formats')));

    // header / sidebar
    $('#settingsBtn').addEventListener('click', () => window.SettingsUI.open());
    $('#enginePill').addEventListener('click', () => window.SettingsUI.open('engines'));
    $('#manageEngines').addEventListener('click', () => window.SettingsUI.open('engines'));
    $('#aboutBtn').addEventListener('click', () => window.SettingsUI.open('about'));

    // shelf
    $('#chooseFilesBtn').addEventListener('click', () => app.pickFiles());
    $('#addFilesBtn').addEventListener('click', () => app.pickFiles());
    $('#dropStrip').addEventListener('click', () => app.pickFiles());
    $('#clearBtn').addEventListener('click', () => app.clearShelf());
    $('#convertAllBtn').addEventListener('click', () => app.convertAll());

    // category + format + tool delegation
    document.addEventListener('click', (e) => {
      const cat = e.target.closest('.cat-card[data-kind]');
      if (cat) {
        app.state.formatsFilter = cat.dataset.kind;
        app.showView('formats');
        return;
      }
      const chip = e.target.closest('.out-chip[data-input][data-output]');
      if (chip) {
        pickForConversion(chip.dataset.input, chip.dataset.output);
        return;
      }
      const filter = e.target.closest('#formatFilters .filter-tab');
      if (filter) {
        app.state.formatsFilter = filter.dataset.kind;
        app.renderFormats();
        return;
      }
      const toolFilter = e.target.closest('#toolFilters .filter-tab');
      if (toolFilter) {
        app.state.toolsFilter = toolFilter.dataset.kind;
        app.renderTools();
        return;
      }
      const toolCard = e.target.closest('.tool-card[data-tool]');
      if (toolCard) {
        const tool = (app.state.registry.tools || []).find((t) => t.id === toolCard.dataset.tool);
        if (tool) window.ToolUI.start(tool);
        return;
      }
      const activity = e.target.closest('#activityList [data-reveal]');
      if (activity) {
        api.file.reveal(activity.dataset.reveal);
      }
    });

    // format search
    const search = $('#formatSearch');
    if (search) {
      search.addEventListener('input', () => {
        app.state.formatSearch = search.value;
        app.renderFormats();
      });
    }

    // queue delegation
    const fileList = $('#fileList');
    if (fileList) {
      fileList.addEventListener('click', (e) => {
        const row = e.target.closest('.file-row[data-id]');
        if (!row) return;
        const entry = app.state.entries.find((item) => String(item.id) === row.dataset.id);
        if (!entry) return;
        const actionEl = e.target.closest('[data-act]');
        if (!actionEl) return;
        const action = actionEl.dataset.act;
        if (action === 'convert') app.convertEntry(entry);
        else if (action === 'retry') {
          entry.status = 'idle';
          entry.error = null;
          app.renderQueue();
          app.convertEntry(entry);
        } else if (action === 'open') {
          if (entry.output) api.file.open(entry.output);
        } else if (action === 'remove') app.removeEntry(entry);
        else if (action === 'tools') openWheel(entry, 'tools');
        else if (action === 'actions') openWheel(entry, 'actions');
      });
      fileList.addEventListener('change', (e) => {
        const select = e.target.closest('[data-select]');
        if (!select) return;
        const entry = app.state.entries.find((item) => String(item.id) === select.dataset.select);
        if (!entry) return;
        entry.target = select.value;
        if (entry.status === 'done' || entry.status === 'error') {
          entry.status = 'idle';
          entry.error = null;
          entry.output = null;
          app.renderQueue();
        }
      });
      fileList.addEventListener('dblclick', (e) => {
        const row = e.target.closest('.file-row[data-id]');
        if (!row) return;
        const entry = app.state.entries.find((item) => String(item.id) === row.dataset.id);
        if (entry) api.file.showInFolder(entry.path);
      });
    }

    // wheel scrim
    const wheelLayer = $('#wheelLayer');
    if (wheelLayer) {
      wheelLayer.addEventListener('mousedown', (e) => {
        if (e.target.closest('[data-wheel-close]')) closeWheel();
      });
    }

    // modal close
    const modalRoot = $('#modalRoot');
    if (modalRoot) {
      modalRoot.addEventListener('mousedown', (e) => {
        if (e.target.closest('[data-close]')) closeModal();
      });
    }

    // keyboard
    document.addEventListener('keydown', (e) => {
      const typing = e.target.closest('input, textarea, select, [contenteditable="true"]');
      const modalOpen = !$('#modalRoot').hidden;
      if (e.key === 'Escape') {
        if (modalOpen) {
          closeModal();
          e.preventDefault();
          return;
        }
        if (app.state.wheelEntry) {
          closeWheel();
          e.preventDefault();
        }
        return;
      }
      if (modalOpen) return;
      if (app.state.wheelEntry && !typing) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          window.__wheel.cycle(-1);
          e.preventDefault();
          return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          window.__wheel.cycle(1);
          e.preventDefault();
          return;
        }
        if (e.key === 'Enter') {
          window.__wheel.chooseCurrent();
          e.preventDefault();
          return;
        }
      }
      if (typing) return;
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        window.SettingsUI.open();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        app.pickFiles();
      }
    });

    if (!window.__wheel && window.Wheel) {
      window.__wheel = new window.Wheel(document.getElementById('wheelLayer'));
    }

    // drag/drop
    window.addEventListener('dragenter', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (!drag) {
        const guess = guessDrop(e.dataTransfer);
        drag = { ...guess, mode: null, options: [], pseudo: null };
        const ghostEl = $('#dragGhost');
        if (ghostEl) {
          ghostEl.hidden = false;
          const iconEl = $('#dragGhostIcon');
          if (iconEl) iconEl.innerHTML = ghostIcon();
          iconEl.dataset.kind = `${drag.kind}:${drag.ext}`;
        }
        const layer = $('#dropLayer');
        layer.hidden = false;
        layer.classList.add('is-open');
        AppUI.hydrateIcons(layer);
      }
      lastPoint = { x: e.clientX, y: e.clientY };
      dragKeys = { shift: e.shiftKey, ctrl: e.ctrlKey, alt: e.altKey };
      updateGhost(e.clientX, e.clientY);
      applyDragMode(modeFromKeys(e), e);
    });

    window.addEventListener('dragover', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      lastPoint = { x: e.clientX, y: e.clientY };
      dragKeys = { shift: e.shiftKey, ctrl: e.ctrlKey, alt: e.altKey };
      updateGhost(e.clientX, e.clientY);
      if (drag) applyDragMode(modeFromKeys(e), e);
    });

    window.addEventListener('dragleave', (e) => {
      if (!drag) return;
      if (e.relatedTarget === null || e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        endDrag();
      }
    });

    window.addEventListener('drop', (e) => {
      handleDrop(e);
    });

    window.addEventListener('dragend', () => {
      if (drag) endDrag();
    });

    // modifier keys while an OS drag is active
    window.addEventListener('keydown', (e) => {
      if (!drag) return;
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt') {
        if (e.key === 'Shift') dragKeys.shift = true;
        if (e.key === 'Control') dragKeys.ctrl = true;
        if (e.key === 'Alt') dragKeys.alt = true;
      }
      const mode = dragKeys.shift ? 'convert' : dragKeys.ctrl ? 'tools' : dragKeys.alt ? 'actions' : null;
      applyDragMode(mode, null);
    });
    window.addEventListener('keyup', (e) => {
      if (!drag) return;
      if (e.key === 'Shift') dragKeys.shift = false;
      if (e.key === 'Control') dragKeys.ctrl = false;
      if (e.key === 'Alt') dragKeys.alt = false;
      const mode = dragKeys.shift ? 'convert' : dragKeys.ctrl ? 'tools' : dragKeys.alt ? 'actions' : null;
      applyDragMode(mode, null);
    });
  }

  const AppUI = { toast, openModal, closeModal, hydrateIcons };
  window.AppUI = AppUI;
  window.Interactions = {
    bind,
    openWheel,
    closeWheel,
    runAction,
    toast,
    openModal,
    closeModal,
    pickForConversion,
    findTool
  };
})();
