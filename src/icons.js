'use strict';

(function () {
  const paths = {
    shelf: '<path d="M4 6.5h16M4 12h16M4 17.5h10"/>',
    formats: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    tools: '<path d="M14.7 6.3a4 4 0 0 0-5.3 5.3L4 17v3h3l5.4-5.4a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.2-2.2 2.7-3.3Z"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.08.36.29.7.6 1 .3.27.69.4 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.6Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m4.5 12.5 5 5 10-11"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.2 12.2 2.6 2.6 5.2-5.6"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V13M12 16.4v.1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8v.1"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    chevronDown: '<path d="m6 9.5 6 6 6-6"/>',
    arrowRight: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    arrowUpRight: '<path d="M7 17 17 7M8 7h9v9"/>',
    folder: '<path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z"/>',
    folderOpen: '<path d="M3.5 8V6.5A2 2 0 0 1 5.5 4.5h4l2 2h6a2 2 0 0 1 2 2v1"/><path d="M3.5 9.5h17l-2 8.5h-15l-2-8.5Z"/>',
    file: '<path d="M6 3.5h7l5 5v12H6z"/><path d="M13 3.5v5h5"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    share: '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    float: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><rect x="12" y="11" width="6" height="5" rx="1"/>',
    move: '<path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l1.7 1.8H18a2.5 2.5 0 0 1 2.5 2.5v6.2A2.5 2.5 0 0 1 18 18H6a2.5 2.5 0 0 1-2.5-2.5V7.5Z"/><path d="M9 12h6m-2.5-2.5L15 12l-2.5 2.5"/>',
    path: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h4a4 4 0 0 0 4-4V8"/>',
    terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="m7 9 3 3-3 3M12.5 15H17"/>',
    cpu: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 2.5v3M14 2.5v3M10 18.5v3M14 18.5v3M2.5 10h3M2.5 14h3M18.5 10h3M18.5 14h3"/>',
    zap: '<path d="M13 2.5 4.5 13.5H11l-1 8L19.5 10H13l1-7.5Z"/>',
    lock: '<rect x="5" y="10" width="14" height="10.5" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-.6 4M20 4v7h-7"/>',
    loader: '<path d="M12 3.5a8.5 8.5 0 1 1-8.5 8.5" />',
    download: '<path d="M12 3.5v11M7.5 10l4.5 4.5L16.5 10"/><path d="M4.5 17.5v2h15v-2"/>',
    sparkle: '<path d="M12 3.5c.6 4.7 2.8 6.9 7.5 7.5-4.7.6-6.9 2.8-7.5 7.5-.6-4.7-2.8-6.9-7.5-7.5 4.7-.6 6.9-2.8 7.5-7.5Z"/>',
    key: '<rect x="3" y="7" width="18" height="10" rx="2.5"/><path d="M7 12h.01M11 12h.01M15 12h2"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
    grid: '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3.5 12 8.5 4.7 8.5-4.7M3.5 16l8.5 4.7 8.5-4.7"/>',
    image: '<rect x="3.5" y="4" width="17" height="16" rx="3"/><circle cx="8.5" cy="9" r="1.6"/><path d="m4.5 17.5 4.8-5 3.8 4 3-3.5 3.4 4.5"/>',
    play: '<path d="M8 5.5v13l11-6.5-11-6.5Z"/>',
    pause: '<path d="M8 5.5v13M16 5.5v13"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2H10"/>',
    wand: '<path d="m4 20 10-10M13 3.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5ZM19 12l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"/>',
    scissors: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5 20 18M8 16.5 20 6"/>',
    music: '<path d="M9 18V6l10-2v11"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="15" r="2.5"/>',
    film: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M8 4.5v15M16 4.5v15M3.5 9h4.5M3.5 15h4.5M16 9h4.5M16 15h4.5"/>',
    doc: '<path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4M9 12h6M9 15.5h6"/>',
    archive: '<rect x="3.5" y="4" width="17" height="5" rx="1.5"/><path d="M5 9v10.5h14V9M10 13h4"/>'
  };

  function icon(name, size = 18, cls = '') {
    const path = paths[name] || paths.file;
    return `<svg class="ui-icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  const FILE_ICONS = new Set(['7z','aiff','avi','avif','bmp','csv','docx','epub','flac','gif','gz','heic','htm','html','jpeg','jpg','m4a','markdown','md','mkv','mov','mp3','mp4','ods','odt','ogg','opus','pages','pdf','png','ppt','pptx','rar','rtf','srt','svg','tar','tex','tgz','tif','tiff','tsv','txt','vtt','wav','webm','webp','wma','wmv','xls','xlsx','zip']);

  function fileIcon(ext, size = 40, cls = '') {
    const key = String(ext || '').toLowerCase();
    if (FILE_ICONS.has(key)) {
      return `<img class="file-icon ${cls}" src="../assets/icons/files/${key}.png" width="${size}" height="${size}" alt="" draggable="false">`;
    }
    return `<span class="file-icon generic ${cls}" style="width:${size}px;height:${size}px">${icon('file', Math.round(size * 0.55))}</span>`;
  }

  function categoryIcon(name) {
    return `../assets/icons/categories/${name}.svg`;
  }

  function toolIcon(id) {
    return `../assets/icons/tools/${id}.svg`;
  }

  const KIND_ICONS = {
    image: 'image', video: 'film', audio: 'music', pdf: 'doc', document: 'doc', slides: 'layers', spreadsheet: 'grid', subtitle: 'doc', archive: 'archive', folder: 'folder', other: 'file'
  };

  function kindIcon(kind, size = 18) {
    return icon(KIND_ICONS[kind] || 'file', size);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtBytes(bytes) {
    const n = Number(bytes || 0);
    if (!n) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
    const value = n / Math.pow(1024, i);
    return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
  }

  function fmtDuration(seconds) {
    const s = Math.max(0, Math.round(Number(seconds) || 0));
    if (!s) return '';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function extOf(filePath) {
    const name = String(filePath || '').split(/[\\/]/).pop() || '';
    const idx = name.lastIndexOf('.');
    return idx > 0 ? name.slice(idx + 1).toLowerCase() : '';
  }

  function baseName(filePath) {
    return String(filePath || '').split(/[\\/]/).pop() || '';
  }

  function stripExt(filePath) {
    const name = baseName(filePath);
    const idx = name.lastIndexOf('.');
    return idx > 0 ? name.slice(0, idx) : name;
  }

  function fileUrl(filePath) {
    const normalized = String(filePath || '').replace(/\\/g, '/');
    const parts = normalized.split('/').map((part, i) => (i === 0 ? part : encodeURIComponent(part)));
    return `file:///${parts.join('/')}`;
  }

  window.UI = {
    icon,
    fileIcon,
    categoryIcon,
    toolIcon,
    kindIcon,
    escapeHtml,
    fmtBytes,
    fmtDuration,
    extOf,
    baseName,
    stripExt,
    fileUrl
  };
})();
