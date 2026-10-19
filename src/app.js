'use strict';

(function () {
  const U = window.UI;
  const api = window.api;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const KIND_ORDER = ['image', 'video', 'audio', 'pdf', 'document', 'slides', 'spreadsheet', 'subtitle', 'archive', 'folder'];
  const KIND_ICON = {
    image: 'images', video: 'video', audio: 'audio', pdf: 'pdf', document: 'documents',
    slides: 'slides', spreadsheet: 'spreadsheets', subtitle: 'subtitles', archive: 'archives', folder: 'documents'
  };
  const DEFAULT_EXT = {
    image: 'jpg', video: 'mp4', audio: 'mp3', pdf: 'pdf', document: 'docx',
    slides: 'pptx', spreadsheet: 'xlsx', subtitle: 'srt', archive: 'zip', folder: 'folder'
  };
  const ENGINES = [
    { id: 'ffmpeg', name: 'FFmpeg', desc: 'Audio, video & GIF' },
    { id: 'magick', name: 'ImageMagick', desc: 'Images & PDF pages' },
    { id: 'soffice', name: 'LibreOffice', desc: 'Documents, slides & sheets' },
    { id: 'pandoc', name: 'Pandoc', desc: 'Markdown, HTML & EPUB' },
    { id: '7z', name: '7-Zip', desc: 'Archives' },
    { id: 'gs', name: 'Ghostscript', desc: 'PDF compression', optional: true }
  ];

  const state = {
    registry: null,
    settings: null,
    engineStatus: {},
    appInfo: null,
    entries: [],
    targetsByExt: new Map(),
    categoryCounts: {},
    categoryFormats: {},
    activity: [],
    stats: { converted: 0, bytes: 0 },
    seq: 0,
    activitySeq: 0,
    view: 'shelf',
    formatsFilter: 'all',
    formatSearch: '',
    toolsFilter: 'all',
    converting: false,
    wheelEntry: null,
    wheelMode: 'convert',
    wheelOptions: [],
    wheelDrag: false,
    drag: null,
    installing: null,
    installLog: null,
    activeToolJob: null,
    toolModal: null,
    settingsSection: null
  };

  function categoryLabel(kind) {
    const cat = state.registry && state.registry.categories[kind];
    return cat ? cat.label : kind;
  }

  function formatLabel(ext) {
    if (!ext) return '—';
    const f = state.registry && state.registry.formats[ext];
    return f ? f.label : String(ext).toUpperCase();
  }

  function categoryForExt(ext) {
    const f = state.registry && state.registry.formats[ext];
    return f ? f.category : 'other';
  }

  function targetsForEntry(entry) {
    if (!entry || !entry.info) return [];
    const key = entry.info.isDir ? 'folder' : entry.info.ext;
    return state.targetsByExt.get(key) || [];
  }

  function targetLabel(ext) {
    const found = state.targetsByExt.get(ext) || [];
    return formatLabel(ext);
  }

  function buildIndexes() {
    const conversions = state.registry.conversions;
    state.targetsByExt = new Map();
    state.categoryCounts = {};
    state.categoryFormats = {};
    const seen = new Map();
    for (const c of conversions) {
      state.categoryCounts[c.category] = (state.categoryCounts[c.category] || 0) + 1;
      if (!state.categoryFormats[c.category]) state.categoryFormats[c.category] = new Set();
      if (!seen.has(c.inputExt)) seen.set(c.inputExt, new Set());
      const inputSeen = seen.get(c.inputExt);
      if (inputSeen.has(c.outputExt)) continue;
      inputSeen.add(c.outputExt);
      if (!state.targetsByExt.has(c.inputExt)) state.targetsByExt.set(c.inputExt, []);
      state.targetsByExt.get(c.inputExt).push({
        ext: c.outputExt,
        label: formatLabel(c.outputExt),
        note: c.note || ''
      });
      state.categoryFormats[c.category].add(formatLabel(c.outputExt));
    }
    for (const kind of Object.keys(state.categoryFormats)) {
      state.categoryFormats[kind] = Array.from(state.categoryFormats[kind]);
    }
  }

  // ------------------------------------------------------------------ views

  function showView(view) {
    state.view = view;
    $$('.view').forEach((el) => { el.hidden = el.id !== `view-${view}`; });
    $$('.app-tab').forEach((el) => el.classList.toggle('active', el.dataset.view === view));
    const main = $('#mainCard');
    if (main) main.scrollTop = 0;
    if (view === 'formats') renderFormats();
    if (view === 'tools') renderTools();
    if (view === 'shelf') renderQueue();
  }

  function renderCategories() {
    const grid = $('#categoryGrid');
    if (!grid || !state.registry) return;
    grid.innerHTML = KIND_ORDER.filter((kind) => kind !== 'folder').map((kind) => {
      const exts = state.categoryFormats[kind] || [];
      const shown = exts.slice(0, 4).join(' · ');
      const extra = exts.length > 4 ? ` +${exts.length - 4}` : '';
      return `
        <button class="cat-card" data-kind="${kind}" type="button">
          <span class="cat-icon"><img src="${U.categoryIcon(KIND_ICON[kind])}" alt="" draggable="false"></span>
          <span class="cat-name"><span>${U.escapeHtml(categoryLabel(kind))}</span><span class="cat-count">${state.categoryCounts[kind] || 0}</span></span>
          <span class="cat-formats">${U.escapeHtml(shown)}${extra}</span>
        </button>`;
    }).join('');
  }

  function filteredConversions() {
    const search = state.formatSearch.trim().toLowerCase();
    const list = state.registry.conversions.filter((c) => {
      if (state.formatsFilter !== 'all' && c.category !== state.formatsFilter) return false;
      if (!search) return true;
      const hay = `${c.inputExt} ${c.outputExt} ${c.label} ${categoryLabel(c.category)}`.toLowerCase();
      return hay.includes(search);
    });
    const groups = new Map();
    for (const c of list) {
      if (!groups.has(c.inputExt)) groups.set(c.inputExt, []);
      groups.get(c.inputExt).push(c);
    }
    return Array.from(groups.entries()).sort((a, b) => {
      const ca = KIND_ORDER.indexOf(categoryForExt(a[0]));
      const cb = KIND_ORDER.indexOf(categoryForExt(b[0]));
      return ca - cb || a[0].localeCompare(b[0]);
    });
  }

  function renderFormats() {
    if (!state.registry) return;
    const listEl = $('#formatList');
    if (!listEl) return;
    const filters = ['all', ...KIND_ORDER];
    const filterEl = $('#formatFilters');
    if (filterEl) {
      filterEl.innerHTML = filters.map((kind) => {
        const label = kind === 'all' ? 'All' : categoryLabel(kind);
        return `<button class="filter-tab ${state.formatsFilter === kind ? 'active' : ''}" data-kind="${kind}" type="button">${U.escapeHtml(label)}</button>`;
      }).join('');
    }
    const groups = filteredConversions();
    if (!groups.length) {
      listEl.innerHTML = '<div class="format-empty">No formats match that search. Try “JPG”, “PDF” or “MP4”.</div>';
    } else {
      listEl.innerHTML = groups.map(([inputExt, items]) => {
        const cat = categoryForExt(inputExt);
        const outs = items.map((c) => (
          `<button class="out-chip" data-input="${inputExt}" data-output="${c.outputExt}" type="button" title="Choose a ${formatLabel(inputExt)} file and convert to ${formatLabel(c.outputExt)}">${formatLabel(c.outputExt)} <span class="out-arrow">→</span></button>`
        )).join('');
        return `
          <div class="format-row">
            <div class="format-input">
              ${U.fileIcon(inputExt, 27)}
              <div><span class="fmt-name">${formatLabel(inputExt)}</span><span class="fmt-cat">${U.escapeHtml(categoryLabel(cat))}</span></div>
            </div>
            <div class="format-arrow">${U.icon('arrowRight', 13)}</div>
            <div class="format-outs">${outs}</div>
          </div>`;
      }).join('');
    }
    const note = $('#importNote');
    if (note) {
      note.innerHTML = (state.registry.importNotes || []).map((n) => `<strong>${U.escapeHtml(n.formats)}</strong>${n.note}`).join('<span class="sep">·</span>');
    }
    const count = $('#formatCount');
    if (count) count.textContent = state.registry.conversionCount;
  }

  function toolKindList(tool) {
    const unique = Array.from(new Set(tool.kinds));
    return unique.map((k) => `<span class="kind-chip">${U.escapeHtml(k)}</span>`).join('');
  }

  function shortToolName(tool) {
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

  function renderTools() {
    if (!state.registry) return;
    const tools = state.registry.tools || [];
    const kinds = ['all'];
    for (const tool of tools) for (const kind of tool.kinds) if (!kinds.includes(kind)) kinds.push(kind);
    const filterEl = $('#toolFilters');
    if (filterEl) {
      filterEl.innerHTML = kinds.map((kind) => (
        `<button class="filter-tab ${state.toolsFilter === kind ? 'active' : ''}" data-kind="${kind}" type="button">${kind === 'all' ? 'All tools' : U.escapeHtml(categoryLabel(kind))}</button>`
      )).join('');
    }
    const filtered = tools.filter((tool) => state.toolsFilter === 'all' || tool.kinds.includes(state.toolsFilter));
    const grid = $('#toolGrid');
    if (!grid) return;
    grid.innerHTML = filtered.map((tool) => `
      <button class="tool-card" data-tool="${tool.id}" type="button">
        <span class="tool-card-top">
          <span class="tool-icon-box"><img src="${U.toolIcon(tool.id)}" alt="" draggable="false"></span>
          <span class="tool-card-arrow">${U.icon('arrowUpRight', 15)}</span>
        </span>
        <span class="tool-name">${U.escapeHtml(tool.name)}</span>
        <span class="tool-desc">${U.escapeHtml(tool.desc)}</span>
        <span class="tool-kinds">${toolKindList(tool)}</span>
      </button>`).join('');
    const count = $('#toolCount');
    if (count) count.textContent = tools.length;
  }

  // ------------------------------------------------------------------ queue

  function entryIcon(entry, size = 38) {
    if (entry.thumb) return `<img class="file-icon" src="${entry.thumb}" width="${size}" height="${size}" alt="" draggable="false">`;
    if (entry.info.isDir) {
      return `<span class="file-icon generic" style="width:${size}px;height:${size}px">${U.icon('folder', Math.round(size * 0.58))}</span>`;
    }
    return U.fileIcon(entry.info.ext, size);
  }

  function entryMeta(entry) {
    const bits = [];
    const label = entry.info.isDir ? 'FOLDER' : formatLabel(entry.info.ext);
    bits.push(U.escapeHtml(label));
    if (entry.info.size) bits.push(U.fmtBytes(entry.info.size));
    if (entry.info.pages) bits.push(`${entry.info.pages} page${entry.info.pages === 1 ? '' : 's'}`);
    if (entry.info.width && entry.info.height) bits.push(`${entry.info.width}×${entry.info.height}`);
    if (entry.info.duration) bits.push(U.fmtDuration(entry.info.duration));
    if (entry.status === 'done' && entry.output) {
      return `<span class="done-label">Done</span><span class="dot"></span><span class="output-name">${U.escapeHtml(U.baseName(entry.output))}</span>`;
    }
    if (entry.status === 'running') {
      return `<span class="err-label" style="color:var(--orange)">Converting to ${U.escapeHtml(formatLabel(entry.target))}</span><span class="dot"></span><span class="mono">${entry.progress || 0}%</span>`;
    }
    if (entry.status === 'queued') {
      return `<span>Waiting to become ${U.escapeHtml(formatLabel(entry.target))}</span>`;
    }
    return bits.join('<span class="dot"></span>');
  }

  function renderRunButton(entry) {
    const hasTarget = Boolean(entry.target);
    if (entry.status === 'running') {
      return `<button class="file-run running" type="button" disabled><span class="spinner"></span>${entry.progress || 0}%</button>`;
    }
    if (entry.status === 'queued') {
      return '<button class="file-run running" type="button" disabled><span class="spinner"></span>Queued</button>';
    }
    if (entry.status === 'done') {
      return `<button class="file-run done" data-act="open" type="button">${U.icon('check', 13)}Open</button>`;
    }
    if (entry.status === 'error') {
      return `<button class="file-run error" data-act="retry" type="button">${U.icon('refresh', 13)}Retry</button>`;
    }
    return `<button class="file-run" data-act="convert" type="button" ${hasTarget ? '' : 'disabled'}>${hasTarget ? 'Convert' : 'No output'} ${hasTarget ? U.icon('arrowRight', 12) : ''}</button>`;
  }

  function renderQueue() {
    const empty = $('#shelfEmpty');
    const queue = $('#shelfQueue');
    if (!empty || !queue) return;
    const count = state.entries.length;
    empty.hidden = count > 0;
    queue.hidden = count === 0;
    if (!count) return;
    const total = state.entries.reduce((sum, e) => sum + (e.info.size || 0), 0);
    $('#queueCount').textContent = `${count} file${count === 1 ? '' : 's'}`;
    $('#queueSize').textContent = U.fmtBytes(total);
    const list = $('#fileList');
    list.innerHTML = state.entries.map((entry) => {
      const targets = targetsForEntry(entry);
      const opts = targets.length
        ? targets.map((t) => `<option value="${t.ext}" ${entry.target === t.ext ? 'selected' : ''}>${t.label}</option>`).join('')
        : '<option value="">No conversions</option>';
      const disabled = entry.status === 'running' || entry.status === 'queued';
      return `
        <div class="file-row ${entry.status}" data-id="${entry.id}">
          <div class="file-icon-wrap" data-icon-wrap="${entry.id}">${entryIcon(entry)}</div>
          <div class="file-info">
            <div class="file-name" title="${U.escapeHtml(entry.path)}">${U.escapeHtml(entry.info.name)}</div>
            <div class="file-meta">${entryMeta(entry)}</div>
            ${entry.status === 'error' && entry.error ? `<div class="file-error" title="${U.escapeHtml(entry.error)}">${U.escapeHtml(entry.error)}</div>` : ''}
          </div>
          <div class="file-target">
            <span class="target-arrow">${U.icon('arrowRight', 13)}</span>
            <select class="target-select" data-select="${entry.id}" ${disabled ? 'disabled' : ''} aria-label="Output format">${opts}</select>
          </div>
          <div class="file-actions">
            <button class="mini-btn" data-act="tools" type="button" title="Open the tool wheel">${U.icon('tools', 15)}</button>
            <button class="mini-btn" data-act="actions" type="button" title="File actions">${U.icon('grid', 15)}</button>
            <button class="mini-btn danger" data-act="remove" type="button" title="Remove from shelf" ${entry.status === 'running' || entry.status === 'queued' ? 'disabled' : ''}>${U.icon('x', 14)}</button>
            ${renderRunButton(entry)}
          </div>
          ${entry.status === 'running' || entry.status === 'queued' ? `<div class="file-progress"><span style="width:${entry.progress || 0}%"></span></div>` : ''}
        </div>`;
    }).join('');
    const idleCount = state.entries.filter((e) => e.status === 'idle' && e.target).length;
    const all = $('#convertAllBtn');
    if (all) {
      all.disabled = idleCount === 0;
      all.innerHTML = idleCount > 1 ? `Convert ${idleCount} files ${U.icon('arrowRight', 14)}` : `Convert all ${U.icon('arrowRight', 14)}`;
    }
  }

  function updateRowProgress(entry) {
    const row = document.querySelector(`.file-row[data-id="${entry.id}"]`);
    if (!row) return;
    const bar = row.querySelector('.file-progress span');
    if (bar) bar.style.width = `${entry.progress || 0}%`;
    const btn = row.querySelector('.file-run.running');
    if (btn) btn.innerHTML = `<span class="spinner"></span>${entry.progress || 0}%`;
  }

  function updateRowIcon(entry) {
    const wrap = document.querySelector(`[data-icon-wrap="${entry.id}"]`);
    if (wrap) wrap.innerHTML = entryIcon(entry);
  }

  function renderStats() {
    const files = state.entries.length;
    $('#statFiles').textContent = files;
    $('#statDone').textContent = state.stats.converted;
    $('#statBytes').textContent = U.fmtBytes(state.stats.bytes);
  }

  function renderEnginesSidebar() {
    const el = $('#engineList');
    if (!el) return;
    el.innerHTML = ENGINES.filter((e) => !e.optional).map((engine) => {
      const status = state.engineStatus[engine.id];
      const ok = status && status.ok;
      return `<div class="engine-mini ${ok ? 'ok' : 'missing'}" title="${ok ? U.escapeHtml(status.found) : engine.desc}">
        <span class="dot"></span><span class="label">${engine.name}</span><span class="state">${ok ? 'Ready' : 'Missing'}</span>
      </div>`;
    }).join('');
  }

  function renderEnginePill() {
    const pill = $('#enginePill');
    const text = $('#enginePillText');
    if (!pill || !text) return;
    const missing = ENGINES.filter((e) => !(state.engineStatus[e.id] && state.engineStatus[e.id].ok));
    pill.classList.remove('warn', 'bad');
    if (!missing.length) {
      text.textContent = 'All engines ready';
    } else if (missing.length <= 2) {
      pill.classList.add('warn');
      text.textContent = `${missing.length} engine${missing.length === 1 ? '' : 's'} missing`;
    } else {
      pill.classList.add('bad');
      text.textContent = `Setup · ${missing.length} missing`;
    }
    pill.title = missing.length ? `Missing: ${missing.map((m) => m.name).join(', ')}` : 'All engines are installed';
  }

  function activityIcon(status) {
    if (status === 'running') return U.icon('loader', 12);
    if (status === 'error') return U.icon('alert', 12);
    return U.icon('check', 12);
  }

  function renderActivity() {
    const list = $('#activityList');
    if (!list) return;
    const count = state.activity.length;
    $('#activityCount').textContent = count;
    if (!count) {
      list.innerHTML = '<div class="activity-empty">Nothing yet. Your conversions will land here.</div>';
      return;
    }
    list.innerHTML = state.activity.slice(0, 12).map((item) => `
      <div class="activity-item ${item.status}" ${item.output ? `data-reveal="${U.escapeHtml(item.output)}"` : ''}>
        <span class="activity-icon">${activityIcon(item.status)}</span>
        <span class="activity-main">
          <span class="activity-name" title="${U.escapeHtml(item.name)}">${U.escapeHtml(item.name)}</span>
          <span class="activity-detail">${U.escapeHtml(item.detail || '')}</span>
        </span>
      </div>`).join('');
  }

  function addActivity(entry) {
    const item = {
      id: ++state.activitySeq,
      name: entry.name,
      detail: entry.detail || '',
      status: entry.status || 'done',
      output: entry.output || null,
      time: Date.now()
    };
    state.activity.unshift(item);
    if (state.activity.length > 30) state.activity.length = 30;
    renderActivity();
    return item.id;
  }

  function updateActivity(id, patch) {
    const item = state.activity.find((a) => a.id === id);
    if (!item) return;
    Object.assign(item, patch);
    renderActivity();
  }

  // ------------------------------------------------------------------ files

  async function addFiles(paths, opts = {}) {
    const clean = (paths || []).filter((p) => typeof p === 'string' && p.trim());
    if (!clean.length) return [];
    const probes = await Promise.all(clean.map((p) => api.file.probe(p).catch((err) => ({ error: err.message, path: p }))));
    const added = [];
    let skipped = 0;
    for (let i = 0; i < clean.length; i++) {
      const info = probes[i];
      if (!info || info.error) {
        AppUI.toast(`Could not read ${U.baseName(clean[i])}`, 'error');
        continue;
      }
      if (state.entries.some((e) => e.path.toLowerCase() === clean[i].toLowerCase())) {
        skipped++;
        continue;
      }
      const entry = {
        id: ++state.seq,
        path: clean[i],
        info,
        target: null,
        status: 'idle',
        progress: 0,
        output: null,
        outputInfo: null,
        error: null,
        thumb: null,
        jobId: null
      };
      const targets = targetsForEntry(entry);
      const preferred = opts.target && targets.some((t) => t.ext === opts.target);
      entry.target = preferred ? opts.target : (targets[0] ? targets[0].ext : null);
      if (opts.target && !preferred && targets.length) {
        AppUI.toast(`${formatLabel(info.ext)} cannot become ${formatLabel(opts.target)}. Picked ${formatLabel(entry.target)} instead.`, 'info');
      }
      state.entries.push(entry);
      added.push(entry);
      api.file.thumb(clean[i]).then((url) => {
        if (!url) return;
        entry.thumb = url;
        updateRowIcon(entry);
      }).catch(() => {});
    }
    if (skipped) AppUI.toast(`${skipped} file${skipped === 1 ? ' is' : 's are'} already on the shelf.`, 'info');
    if (added.length) {
      showView('shelf');
      renderQueue();
      renderStats();
    }
    return added;
  }

  function removeEntry(entry) {
    if (entry.status === 'running' || entry.status === 'queued') {
      AppUI.toast('That file is still working. Let it finish first.', 'info');
      return;
    }
    state.entries = state.entries.filter((e) => e.id !== entry.id);
    renderQueue();
    renderStats();
  }

  function clearShelf() {
    const busy = state.entries.filter((e) => e.status === 'running' || e.status === 'queued');
    if (busy.length) {
      state.entries = busy;
      AppUI.toast('Kept the files that are still working.', 'info');
    } else {
      state.entries = [];
    }
    renderQueue();
    renderStats();
  }

  async function pickFiles(opts = {}) {
    try {
      const paths = await api.file.pick(opts);
      if (paths && paths.length) return addFiles(paths, { target: opts.target });
    } catch (err) {
      AppUI.toast(err.message || 'Could not open the file picker.', 'error');
    }
    return [];
  }

  // -------------------------------------------------------------- conversion

  function convertEntry(entry, target) {
    if (!entry) return;
    const chosen = target || entry.target;
    if (!chosen) {
      AppUI.toast('Pick an output format first.', 'info');
      return;
    }
    if (entry.status === 'running' || entry.status === 'queued') return;
    entry.target = chosen;
    entry.status = 'queued';
    entry.progress = 0;
    entry.error = null;
    entry.output = null;
    entry.outputInfo = null;
    renderQueue();
    processQueue();
  }

  function convertAll() {
    let started = 0;
    for (const entry of state.entries) {
      if (entry.status === 'idle' && entry.target) {
        entry.status = 'queued';
        entry.progress = 0;
        entry.error = null;
        started++;
      }
    }
    if (!started) {
      AppUI.toast('Everything on the shelf is already converted.', 'info');
      return;
    }
    renderQueue();
    processQueue();
  }

  async function processQueue() {
    if (state.converting) return;
    const entry = state.entries.find((e) => e.status === 'queued');
    if (!entry) return;
    state.converting = true;
    entry.status = 'running';
    entry.progress = 0;
    entry.jobId = `conv-${entry.id}-${Date.now()}`;
    renderQueue();
    const actId = addActivity({
      name: entry.info.name,
      detail: `Converting to ${formatLabel(entry.target)}`,
      status: 'running'
    });
    let result;
    try {
      result = await api.convert.run({ id: entry.jobId, input: entry.path, ext: entry.target });
    } catch (err) {
      result = { ok: false, error: err.message || 'Conversion failed.' };
    }
    if (result.ok) {
      entry.status = 'done';
      entry.progress = 100;
      entry.output = result.output;
      entry.error = null;
      try {
        entry.outputInfo = await api.file.probe(result.output);
      } catch {
        entry.outputInfo = null;
      }
      state.stats.converted += 1;
      state.stats.bytes += entry.info.size || 0;
      updateActivity(actId, {
        status: 'done',
        detail: `Saved as ${U.baseName(result.output)}${result.note ? ` · ${result.note}` : ''}`,
        output: result.output
      });
      AppUI.toast(`${entry.info.name} → ${formatLabel(entry.target)}`, 'success', {
        label: 'Show',
        action: () => api.file.reveal(result.output)
      });
      if (state.settings && state.settings.revealAfter) api.file.reveal(result.output);
    } else {
      entry.status = 'error';
      entry.error = result.error || 'Conversion failed.';
      entry.progress = 0;
      updateActivity(actId, { status: 'error', detail: entry.error });
      AppUI.toast(entry.error, 'error', result.code === 'MISSING_TOOL' ? {
        label: 'Open setup',
        action: () => window.SettingsUI && window.SettingsUI.open('engines')
      } : null);
    }
    state.converting = false;
    renderQueue();
    renderStats();
    setTimeout(processQueue, 200);
  }

  function bindProgress() {
    api.tools.onProgress(({ id, percent }) => {
      const entry = state.entries.find((e) => e.jobId === id);
      if (entry) {
        entry.progress = Math.min(99, Math.max(0, percent));
        updateRowProgress(entry);
        return;
      }
      if (state.activeToolJob && state.activeToolJob.jobId === id && typeof state.activeToolJob.onProgress === 'function') {
        state.activeToolJob.onProgress(percent);
      }
    });
  }

  // ------------------------------------------------------------------- boot

  async function start() {
    AppUI.hydrateIcons();
    bindProgress();
    window.Interactions.bind();
    try {
      const [registry, settings, engineStatus, appInfo] = await Promise.all([
        api.registry.get(),
        api.settings.get(),
        api.tools.status(),
        api.app.info()
      ]);
      state.registry = registry;
      state.settings = settings;
      state.engineStatus = engineStatus || {};
      state.appInfo = appInfo;
    } catch (err) {
      AppUI.toast(`Could not start Tangerine: ${err.message}`, 'error');
      return;
    }
    buildIndexes();
    $('#heroFormatCount').textContent = state.registry.conversionCount;
    $('#formatCount').textContent = state.registry.conversionCount;
    $('#toolCount').textContent = state.registry.tools.length;
    $('#aboutBtn').textContent = `v${state.appInfo.version}`;
    renderCategories();
    renderFormats();
    renderTools();
    renderQueue();
    renderStats();
    renderEnginesSidebar();
    renderEnginePill();
    renderActivity();
    if (!state.entries.length) showView('shelf');
  }

  window.App = {
    state,
    api,
    U,
    $,
    $$,
    KIND_ORDER,
    KIND_ICON,
    DEFAULT_EXT,
    ENGINES,
    categoryLabel,
    formatLabel,
    categoryForExt,
    targetsForEntry,
    buildIndexes,
    showView,
    renderCategories,
    renderFormats,
    renderTools,
    renderQueue,
    renderStats,
    renderEnginesSidebar,
    renderEnginePill,
    renderActivity,
    addActivity,
    updateActivity,
    addFiles,
    removeEntry,
    clearShelf,
    pickFiles,
    convertEntry,
    convertAll,
    processQueue,
    updateRowProgress,
    updateRowIcon,
    start
  };

  start();
})();
