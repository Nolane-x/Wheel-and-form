'use strict';

(function () {
  const U = window.UI;
  const $ = (sel, root = document) => root.querySelector(sel);
  const api = window.api;

  let current = null;

  function app() {
    return window.App || null;
  }

  function kindOf(entry) {
    return entry && entry.info ? entry.info.kind : 'other';
  }

  function optionList(tool, kind) {
    if (!tool.options) return [];
    return tool.options[kind] || [];
  }

  function defaultsFor(tool, kind) {
    const values = {};
    for (const opt of optionList(tool, kind)) {
      values[opt.key] = Array.isArray(opt.value) ? opt.value.slice() : opt.value;
    }
    return values;
  }

  function suffixFor(tool, kind) {
    const values = current ? current.values : {};
    if (tool.id === 'audioChannels') return values.channels === '2' ? 'Stereo' : 'Mono';
    if (tool.id === 'changeVideoSpeed') return `${values.speed || '2'}×`;
    return tool.outputExt ? tool.outputExt.toUpperCase() : 'New file';
  }

  // ---------------------------------------------------------------- preview

  function imageFilter(values) {
    const exposure = Math.pow(2, Number(values.exposure || 0));
    const brightness = 1 + Number(values.brightness || 0) / 100;
    const contrast = 1 + Number(values.contrast || 0) / 100;
    const saturation = Math.max(0, Number(values.saturation == null ? 100 : values.saturation) / 100);
    return `brightness(${(exposure * brightness).toFixed(3)}) contrast(${contrast.toFixed(3)}) saturate(${saturation.toFixed(3)})`;
  }

  function cropBox(values, container) {
    const raw = String(values.aspect || '1:1');
    const parts = raw.split(':').map(Number);
    const ratio = parts.length === 2 && parts[0] && parts[1] ? parts[0] / parts[1] : 1;
    let w = 76;
    let h = w / ratio;
    if (h > 76) { h = 76; w = h * ratio; }
    const gravity = values.gravity || 'center';
    const top = gravity === 'north' ? 10 : gravity === 'south' ? 90 - h : 50 - h / 2;
    const left = 50 - w / 2;
    return `<span class="preview-crop" style="left:${left.toFixed(1)}%;top:${top.toFixed(1)}%;width:${w.toFixed(1)}%;height:${h.toFixed(1)}%"></span>`;
  }

  function redactBox(values) {
    const width = Math.max(5, Math.min(100, Number(values.width || 60)));
    const height = Math.max(5, Math.min(100, Number(values.height || 20)));
    const position = values.position || 'center';
    const top = position === 'north' ? 12 : position === 'south' ? 88 - height : 50 - height / 2;
    return `<span class="preview-redact" style="left:${((100 - width) / 2).toFixed(1)}%;top:${top.toFixed(1)}%;width:${width.toFixed(1)}%;height:${height.toFixed(1)}%"></span>`;
  }

  function captionOverlay(values) {
    if (!current || !current.values.text) return '';
    const position = values.position || 'south';
    const size = String(values.size || '42');
    const fontSize = size === '28' ? 13 : size === '64' ? 25 : 18;
    const color = values.color === 'black' ? '#171917' : values.color === '#f35b28' ? '#ffffff' : '#ffffff';
    const bg = values.color === 'black' ? 'rgba(255,255,255,.78)' : values.color === '#f35b28' ? 'rgba(243,91,40,.92)' : 'rgba(20,22,20,.52)';
    return `<span class="preview-caption pos-${position}" style="font-size:${fontSize}px;color:${color};background:${bg}">${U.escapeHtml(values.text)}</span>`;
  }

  function overlayMarkup() {
    if (!current) return '';
    const { tool, values, info } = current;
    let html = '';
    if (tool.id === 'cropImage') html += cropBox(values);
    if (tool.id === 'redactImage') html += redactBox(values);
    if (tool.id === 'annotateImage') html += captionOverlay(values);
    if (tool.id === 'cropVideo') html += cropBox(values, true);
    if (tool.id === 'redactVideo') html += redactBox(values);
    if (tool.id === 'frameImage') {
      const width = Math.max(2, Math.round(Number(values.width || 28) / 4));
      html += `<span class="preview-frame-inset" style="box-shadow:inset 0 0 0 ${width}px ${values.color || '#fff'}"></span>`;
    }
    if (tool.id === 'createCollage') html += '<span class="preview-gridlines"></span>';
    if (!html) return '';
    return `<span class="preview-overlays" id="toolPreviewOverlays">${html}</span>`;
  }

  function mediaMarkup() {
    if (!current) return '';
    const { entry, tool, values, info } = current;
    const kind = kindOf(entry);
    const tag = `<span class="preview-tag">${U.escapeHtml(tool.name)} · ${U.escapeHtml(entry.info.ext || kind)}</span>`;
    if (kind === 'image') {
      const transform = `rotate(${Number(values.rotate || 0)}deg) scaleX(${values.flip ? -1 : 1})`;
      const style = `filter:${imageFilter(values)};transform:${transform}`;
      return `<img class="tool-preview-media" src="${U.fileUrl(entry.path)}" alt="" draggable="false" style="${U.escapeHtml(style)}">${overlayMarkup()}${tag}`;
    }
    if (kind === 'video') {
      return `<video class="tool-preview-media tool-preview-video" src="${U.fileUrl(entry.path)}#t=0.1" muted preload="metadata" playsinline></video>${overlayMarkup()}${tag}`;
    }
    if (kind === 'audio') {
      return `<div class="preview-audio">
        <span class="preview-audio-icon">${U.icon('music', 24)}</span>
        <span class="preview-wave">${Array.from({ length: 28 }, (_, i) => `<i style="height:${18 + Math.round(Math.abs(Math.sin(i * 0.73)) * 34)}px"></i>`).join('')}</span>
        <span class="preview-audio-name">${U.escapeHtml(entry.info.name)}</span>
      </div>${tag}`;
    }
    const icon = kind === 'folder' ? U.icon('folder', 34) : `<img src="${U.fileIconPath ? U.fileIconPath(entry.info.ext) : U.toolIcon(tool.id)}" alt="">`;
    const fallbackIcon = kind === 'folder'
      ? U.icon('folder', 34)
      : U.fileIcon(entry.info.ext, 44);
    const label = (info && info.label) || String(entry.info.ext || kind || 'File').toUpperCase();
    return `<div class="preview-fallback">
      <span class="preview-fallback-icon">${fallbackIcon}</span>
      <span>${U.escapeHtml(label)} preview</span>
      <small>${U.icon('wand', 11)} ${U.escapeHtml(tool.name)}</small>
    </div>${tag}`;
  }

  function refreshPreview() {
    if (!current) return;
    const slot = $('#toolPreviewMedia');
    if (!slot) return;
    if (kindOf(current.entry) === 'video') {
      const overlays = $('#toolPreviewOverlays');
      if (overlays) overlays.outerHTML = overlayMarkup() || '<span class="preview-overlays" id="toolPreviewOverlays"></span>';
      return;
    }
    slot.innerHTML = mediaMarkup();
  }

  // ----------------------------------------------------------------- markup

  function fileChip() {
    const { entry, tool } = current;
    return `<div class="tool-file-chip">
      ${U.fileIcon(entry.info.ext, 31)}
      <div class="chip-main">
        <strong title="${U.escapeHtml(entry.path)}">${U.escapeHtml(entry.info.name)}</strong>
        <span>${U.escapeHtml(String(entry.info.ext || 'file').toUpperCase())}${entry.info.size ? ` · ${U.fmtBytes(entry.info.size)}` : ''}${entry.info.duration ? ` · ${U.fmtDuration(entry.info.duration)}` : ''}</span>
      </div>
      <span class="chip-kind">${U.escapeHtml(tool.name)}</span>
    </div>`;
  }

  function valueLabel(opt, value) {
    if (opt.type === 'range' || opt.type === 'number') {
      return `${Number(value).toFixed(opt.step && opt.step < 1 ? 1 : 0).replace(/\.0$/, '')}${opt.suffix || ''}`;
    }
    if (opt.type === 'files') return `${Array.isArray(value) ? value.length : 0} file${Array.isArray(value) && value.length === 1 ? '' : 's'}`;
    return '';
  }

  function fieldMarkup(opt) {
    const value = current.values[opt.key];
    if (opt.type === 'range') {
      const min = Number(opt.min);
      const max = Number(opt.max);
      const numeric = Number(value);
      const fill = max === min ? 50 : ((numeric - min) / (max - min)) * 100;
      return `<div class="field">
        <div class="field-label"><span>${U.escapeHtml(opt.label)}</span><span class="field-value" data-value-for="${opt.key}">${U.escapeHtml(valueLabel(opt, value))}</span></div>
        <div class="range-wrap"><input class="range" type="range" data-range-key="${opt.key}" min="${min}" max="${max}" step="${Number(opt.step) || 1}" value="${numeric}" style="--fill:${fill}%"></div>
      </div>`;
    }
    if (opt.type === 'segmented') {
      return `<div class="field">
        <div class="field-label"><span>${U.escapeHtml(opt.label)}</span></div>
        <div class="segmented">${(opt.options || []).map((o) => `<button class="seg-btn ${String(value) === String(o.value) ? 'active' : ''}" type="button" data-seg-key="${opt.key}" data-seg-value="${U.escapeHtml(o.value)}">${U.escapeHtml(o.label)}</button>`).join('')}</div>
      </div>`;
    }
    if (opt.type === 'number') {
      return `<div class="field">
        <div class="field-label"><span>${U.escapeHtml(opt.label)}</span><span class="field-value" data-value-for="${opt.key}">${U.escapeHtml(valueLabel(opt, value))}</span></div>
        <div class="number-wrap"><input class="number-input" type="number" data-number-key="${opt.key}" value="${Number(value) || 0}" min="${opt.min == null ? '' : opt.min}" max="${opt.max == null ? '' : opt.max}" step="${opt.step || 1}"><span class="suffix">${U.escapeHtml(opt.suffix || '')}</span></div>
      </div>`;
    }
    if (opt.type === 'text') {
      return `<div class="field">
        <div class="field-label"><span>${U.escapeHtml(opt.label)}</span></div>
        <input class="text-input" type="text" data-text-key="${opt.key}" value="${U.escapeHtml(value || '')}" placeholder="${U.escapeHtml(opt.placeholder || '')}" maxlength="160">
      </div>`;
    }
    if (opt.type === 'toggle') {
      return `<div class="field">
        <div class="switch-row">
          <div><strong>${U.escapeHtml(opt.label)}</strong></div>
          <button class="switch ${value ? 'on' : ''}" type="button" role="switch" aria-checked="${value ? 'true' : 'false'}" data-toggle-key="${opt.key}" aria-label="${U.escapeHtml(opt.label)}"></button>
        </div>
      </div>`;
    }
    if (opt.type === 'files') {
      const files = Array.isArray(value) ? value : [];
      return `<div class="field">
        <div class="field-label"><span>${U.escapeHtml(opt.label)}</span><span class="field-value" data-value-for="${opt.key}">${files.length} file${files.length === 1 ? '' : 's'}</span></div>
        <button class="files-add" type="button" data-add-extra="${opt.key}" data-accept="${U.escapeHtml(opt.accept || '')}">${U.icon('plus', 12)} ${U.escapeHtml(opt.label)}</button>
        <div class="extra-list">${files.map((file, i) => `<div class="extra-item">${U.fileIcon(U.extOf(file), 15)}<span title="${U.escapeHtml(file)}">${U.escapeHtml(U.baseName(file))}</span><button type="button" data-remove-extra="${i}" aria-label="Remove file">${U.icon('x', 11)}</button></div>`).join('')}</div>
      </div>`;
    }
    return '';
  }

  function bodyMarkup() {
    const fields = optionList(current.tool, current.kind);
    return `
      <div id="toolPreviewMedia" class="tool-preview">${mediaMarkup()}</div>
      ${fields.length ? `<div class="tool-fields">${fields.map(fieldMarkup).join('')}</div>` : '<div class="tool-ready"><span></span>Ready to run with the recommended settings.</div>'}
      <div id="toolError" class="tool-error" hidden></div>
      <div id="toolProgress" class="inline-progress" hidden><span></span></div>
      <div id="toolStatusText" class="tool-modal-status"></div>`;
  }

  function modalMarkup() {
    const { tool } = current;
    return `<section class="modal-card tool-card" role="dialog" aria-modal="true" aria-label="${U.escapeHtml(tool.name)}">
      <header class="modal-head">
        <span class="modal-head-icon tool-head-icon"><img src="${U.toolIcon(tool.id)}" alt=""></span>
        <div class="modal-head-copy">
          <div class="modal-kicker">Tool · ${U.escapeHtml(kindOf(current.entry))}</div>
          <h2 class="modal-title">${U.escapeHtml(tool.name)}</h2>
          <p class="modal-desc">${U.escapeHtml(tool.desc)}</p>
        </div>
        <button class="modal-close" type="button" data-tool-close aria-label="Close">${U.icon('x', 15)}</button>
      </header>
      <div class="modal-body tool-body" id="toolBody">
        ${fileChip()}
        ${bodyMarkup()}
      </div>
      <footer class="modal-foot">
        <div class="modal-foot-left">${U.icon('lock', 12)}<span>Original untouched · Runs locally</span></div>
        <button class="btn btn-primary btn-sm modal-run" type="button" id="toolRunBtn">${U.icon('zap', 13)} Run ${U.escapeHtml(tool.name)}</button>
      </footer>
    </section>`;
  }

  function renderBody() {
    const body = $('#toolBody');
    if (!body) return;
    body.innerHTML = fileChip() + bodyMarkup();
  }

  // ------------------------------------------------------------------- wire

  function setStatus(text) {
    const el = $('#toolStatusText');
    if (el) el.textContent = text || '';
  }

  function showError(message, code) {
    const el = $('#toolError');
    if (!el) return;
    el.hidden = !message;
    if (!message) { el.innerHTML = ''; return; }
    const setup = code === 'MISSING_TOOL'
      ? '<button type="button" data-open-engine-settings>Open engine setup</button>'
      : '';
    el.innerHTML = `${U.icon('alert', 14)}<div><span>${U.escapeHtml(message)}</span>${setup}</div>`;
  }

  function restoreRunButton() {
    const btn = $('#toolRunBtn');
    if (!btn || !current) return;
    btn.disabled = false;
    btn.innerHTML = `${U.icon('zap', 13)} Run ${U.escapeHtml(current.tool.name)}`;
  }

  function setProgress(percent) {
    const wrap = $('#toolProgress');
    const bar = wrap && wrap.querySelector('span');
    if (!wrap || !bar) return;
    wrap.hidden = false;
    bar.style.width = `${Math.max(0, Math.min(100, Number(percent) || 0))}%`;
    setStatus(`Working… ${Math.round(percent || 0)}%`);
  }

  async function runTool() {
    if (!current) return;
    const a = app();
    if (!a) return;
    if (a.state.activeToolJob) return;
    const jobId = `tool-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const btn = $('#toolRunBtn');
    a.state.activeToolJob = { jobId, onProgress: setProgress };
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Working…';
    }
    showError('');
    setStatus('Starting…');
    setProgress(0);
    try {
      const result = await api.tool.run({
        id: jobId,
        input: current.entry.path,
        toolId: current.tool.id,
        options: current.values
      });
      a.state.activeToolJob = null;
      if (!result || !result.ok) {
        restoreRunButton();
        const wrap = $('#toolProgress');
        if (wrap) wrap.hidden = true;
        setStatus('');
        showError((result && result.error) || 'The tool could not finish.', result && result.code);
        return;
      }
      a.state.stats.converted += 1;
      a.renderStats();
      a.addActivity({
        name: current.entry.info.name,
        detail: `${current.tool.name} · ${U.baseName(result.output)}${result.note ? ` · ${result.note}` : ''}`,
        status: 'done',
        output: result.output
      });
      const output = result.output;
      const note = result.note;
      window.AppUI.closeModal();
      window.AppUI.toast(`${current.tool.name} finished${note ? ` · ${note}` : ''}`, 'success', {
        label: 'Show',
        action: () => api.file.reveal(output)
      });
      if (a.state.settings && a.state.settings.revealAfter) api.file.reveal(output);
    } catch (err) {
      a.state.activeToolJob = null;
      restoreRunButton();
      setStatus('');
      showError(err.message || 'The tool could not finish.');
    }
  }

  async function addExtraFiles(key, accept) {
    if (!current) return;
    try {
      const paths = await api.file.pick({ kind: accept, title: 'Add files' });
      if (!paths || !paths.length) return;
      const files = Array.isArray(current.values[key]) ? current.values[key] : [];
      const existing = new Set(files.map((p) => String(p).toLowerCase()));
      const next = files.slice();
      for (const p of paths) {
        if (!existing.has(p.toLowerCase()) && p.toLowerCase() !== current.entry.path.toLowerCase()) {
          next.push(p);
          existing.add(p.toLowerCase());
        }
      }
      current.values[key] = next;
      renderBody();
    } catch (err) {
      window.AppUI.toast(err.message || 'Could not add those files.', 'error');
    }
  }

  function wire(root) {
    if (!root || root.dataset.toolWired === '1') return;
    root.dataset.toolWired = '1';

    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-tool-close]')) {
        window.AppUI.closeModal();
        return;
      }
      if (event.target.closest('[data-open-engine-settings]')) {
        window.SettingsUI.open('engines');
        return;
      }
      const seg = event.target.closest('[data-seg-key]');
      if (seg && current) {
        const key = seg.dataset.segKey;
        current.values[key] = seg.dataset.segValue;
        seg.parentElement.querySelectorAll('[data-seg-key]').forEach((b) => b.classList.toggle('active', b === seg));
        refreshPreview();
        return;
      }
      const toggle = event.target.closest('[data-toggle-key]');
      if (toggle && current) {
        const key = toggle.dataset.toggleKey;
        current.values[key] = !current.values[key];
        toggle.classList.toggle('on', Boolean(current.values[key]));
        toggle.setAttribute('aria-checked', current.values[key] ? 'true' : 'false');
        refreshPreview();
        return;
      }
      const add = event.target.closest('[data-add-extra]');
      if (add && current) {
        addExtraFiles(add.dataset.addExtra, add.dataset.accept);
        return;
      }
      const remove = event.target.closest('[data-remove-extra]');
      if (remove && current) {
        const field = remove.closest('.field');
        const files = (current.values.extra || []).filter((_, i) => String(i) !== remove.dataset.removeExtra);
        current.values.extra = files;
        if (field) {
          const list = field.querySelector('.extra-list');
          if (list) list.innerHTML = files.map((file, i) => `<div class="extra-item">${U.fileIcon(U.extOf(file), 15)}<span title="${U.escapeHtml(file)}">${U.escapeHtml(U.baseName(file))}</span><button type="button" data-remove-extra="${i}" aria-label="Remove file">${U.icon('x', 11)}</button></div>`).join('');
          const label = field.querySelector('[data-value-for="extra"]');
          if (label) label.textContent = `${files.length} file${files.length === 1 ? '' : 's'}`;
        }
        return;
      }
      if (event.target.closest('#toolRunBtn')) runTool();
    });

    root.addEventListener('input', (event) => {
      if (!current) return;
      const range = event.target.closest('[data-range-key]');
      if (range) {
        const key = range.dataset.rangeKey;
        const value = Number(range.value);
        current.values[key] = value;
        const min = Number(range.min);
        const max = Number(range.max);
        range.style.setProperty('--fill', `${max === min ? 50 : ((value - min) / (max - min)) * 100}%`);
        const opt = optionList(current.tool, current.kind).find((o) => o.key === key);
        const out = document.querySelector(`[data-value-for="${key}"]`);
        if (opt && out) out.textContent = valueLabel(opt, value);
        refreshPreview();
        return;
      }
      const number = event.target.closest('[data-number-key]');
      if (number) {
        const key = number.dataset.numberKey;
        const value = Number(number.value);
        current.values[key] = Number.isFinite(value) ? value : 0;
        const opt = optionList(current.tool, current.kind).find((o) => o.key === key);
        const out = document.querySelector(`[data-value-for="${key}"]`);
        if (opt && out) out.textContent = valueLabel(opt, current.values[key]);
        return;
      }
      const text = event.target.closest('[data-text-key]');
      if (text) {
        current.values[text.dataset.textKey] = text.value;
        refreshPreview();
      }
    });
  }

  // ------------------------------------------------------------------- open

  function open(entry, tool) {
    if (!entry || !tool) return;
    const kind = kindOf(entry);
    if (!tool.kinds.includes(kind)) {
      window.AppUI.toast(`${tool.name} does not support ${kind} files.`, 'error');
      return;
    }
    current = {
      entry,
      tool,
      kind,
      values: defaultsFor(tool, kind)
    };
    const a = app();
    if (a) {
      a.state.activeToolJob = null;
      a.state.toolModal = { entry, tool };
    }
    window.AppUI.openModal(modalMarkup());
    wire($('#modalRoot'));
    setStatus(`${suffixFor(tool, kind)} · ${tool.title || tool.name}`);
  }

  async function start(tool) {
    if (!tool) return;
    try {
      const opts = tool.kinds.length === 1 ? { kind: tool.kinds[0], title: `Choose a file for ${tool.name}` } : { title: `Choose a file for ${tool.name}` };
      const paths = await api.file.pick(opts);
      if (!paths || !paths.length) return;
      const info = await api.file.probe(paths[0]);
      if (!info || info.error) {
        window.AppUI.toast(info && info.error ? info.error : 'Could not read that file.', 'error');
        return;
      }
      if (!tool.kinds.includes(info.kind)) {
        window.AppUI.toast(`${tool.name} works with ${tool.kinds.join(' or ')} files. Picked a ${info.kind} file.`, 'error');
        return;
      }
      const a = app();
      if (!a) return;
      let entry = a.state.entries.find((e) => e.path.toLowerCase() === paths[0].toLowerCase());
      if (!entry) {
        const added = await a.addFiles([paths[0]]);
        entry = added[0] || a.state.entries.find((e) => e.path.toLowerCase() === paths[0].toLowerCase());
      }
      if (entry) open(entry, tool);
    } catch (err) {
      window.AppUI.toast(err.message || 'Could not open that tool.', 'error');
    }
  }

  window.ToolUI = { open, start };
})();
