'use strict';

(function () {
  const params = new URLSearchParams(window.location.search);
  const file = params.get('file') || '';
  const mode = params.get('mode') || 'file';
  const name = params.get('name') || file.split(/[\\/]/).pop() || 'Preview';
  const stage = document.getElementById('stage');
  const nameEl = document.getElementById('floatName');
  const metaEl = document.getElementById('floatMeta');
  const localEl = document.getElementById('floatLocal');
  const closeBtn = document.getElementById('closeBtn');
  const U = window.UI;
  const api = window.api;

  function fileUrl(filePath) {
    const normalized = String(filePath || '').replace(/\\/g, '/');
    const parts = normalized.split('/').map((part, i) => (i === 0 ? part : encodeURIComponent(part)));
    return `file:///${parts.join('/')}`;
  }

  function close() {
    try {
      if (api && api.float) api.float.close();
      else window.close();
    } catch {
      window.close();
    }
  }

  closeBtn.addEventListener('click', close);
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  nameEl.textContent = name;
  nameEl.title = file;
  document.title = `Float — ${name}`;

  function fallback(message) {
    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'float-file';
    const icon = document.createElement('div');
    icon.className = 'file-icon generic';
    icon.innerHTML = U ? U.icon('file', 26) : '';
    const strong = document.createElement('strong');
    strong.textContent = name;
    const span = document.createElement('span');
    span.textContent = message || 'No preview available';
    wrap.append(icon, strong, span);
    stage.append(wrap);
  }

  function render() {
    if (!file) {
      fallback('No file was provided.');
      metaEl.textContent = 'Nothing to preview';
      return;
    }
    if (mode === 'folder') {
      stage.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'float-file';
      const icon = document.createElement('div');
      icon.className = 'file-icon generic';
      icon.innerHTML = U ? U.icon('folder', 28) : '';
      const strong = document.createElement('strong');
      strong.textContent = name;
      const span = document.createElement('span');
      span.textContent = 'Folder preview';
      wrap.append(icon, strong, span);
      stage.append(wrap);
      metaEl.textContent = file;
      return;
    }
    if (mode === 'image') {
      const img = document.createElement('img');
      img.alt = name;
      img.src = fileUrl(file);
      img.draggable = false;
      img.addEventListener('error', () => fallback('This image format has no inline preview.'));
      stage.innerHTML = '';
      stage.append(img);
      return;
    }
    if (mode === 'video') {
      const video = document.createElement('video');
      video.src = fileUrl(file);
      video.controls = true;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.addEventListener('error', () => fallback('This video format has no inline preview.'));
      stage.innerHTML = '';
      stage.append(video);
      return;
    }
    if (mode === 'audio') {
      const audio = document.createElement('audio');
      audio.src = fileUrl(file);
      audio.controls = true;
      audio.addEventListener('error', () => fallback('This audio format has no inline preview.'));
      stage.innerHTML = '';
      stage.append(audio);
      return;
    }
    fallback('Drop it into Tangerine to convert it.');
  }

  async function loadMeta() {
    if (!file) return;
    try {
      const info = await api.file.probe(file);
      if (!info || info.error) return;
      const bits = [];
      if (info.isDir) bits.push('Folder');
      else if (info.ext) bits.push(String(info.ext).toUpperCase());
      if (info.size) bits.push(U ? U.fmtBytes(info.size) : `${info.size} B`);
      if (info.width && info.height) bits.push(`${info.width}×${info.height}`);
      if (info.duration) bits.push(U ? U.fmtDuration(info.duration) : `${info.duration}s`);
      if (info.pages) bits.push(`${info.pages} page${info.pages === 1 ? '' : 's'}`);
      metaEl.textContent = bits.join(' · ') || file;
      metaEl.title = file;
      if (info.isDir) localEl.textContent = 'Folder · Local';
    } catch {
      metaEl.textContent = file;
    }
  }

  render();
  loadMeta();
})();
