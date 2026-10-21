'use strict';

(function () {
  const U = window.UI;
  const $ = (sel, root = document) => root.querySelector(sel);
  const api = window.api;
  const SECTIONS = [
    { id: 'output', label: 'Output', icon: 'folder' },
    { id: 'engines', label: 'Engines', icon: 'cpu' },
    { id: 'updates', label: 'Updates', icon: 'download' },
    { id: 'about', label: 'About', icon: 'info' }
  ];

  let section = 'output';

  function app() {
    return window.App || null;
  }

  function getSettings() {
    const a = app();
    return (a && a.state.settings) || {};
  }

  function getStatus() {
    const a = app();
    return (a && a.state.engineStatus) || {};
  }

  function engineMeta(id) {
    const a = app();
    return (a ? a.ENGINES : []).find((e) => e.id === id) || { id, name: id, desc: '' };
  }

  function save(patch) {
    return api.settings.set(patch).then((next) => {
      const a = app();
      if (a) a.state.settings = next;
      return next;
    }).catch((err) => {
      window.AppUI.toast(err.message || 'Could not save settings.', 'error');
      return null;
    });
  }

  // Keep winget output alive even when the modal is closed mid-install.
  api.tools.onInstallOutput(({ tool, text }) => {
    const a = app();
    if (!a) return;
    a.state.installing = tool;
    a.state.installLog = String(a.state.installLog || '') + String(text || '');
    if (a.state.installLog.length > 16000) a.state.installLog = a.state.installLog.slice(-16000);
    const log = $('#settingsInstallLog');
    if (log) {
      log.textContent = a.state.installLog;
      log.scrollTop = log.scrollHeight;
    }
  });

  // ------------------------------------------------------------------ markup

  function headIcon() {
    return `<span class="modal-head-icon">${U.icon('settings', 19)}</span>`;
  }

  function navMarkup() {
    return SECTIONS.map((s) => `
      <button class="settings-nav-btn ${section === s.id ? 'active' : ''}" type="button" data-settings-section="${s.id}">
        ${U.icon(s.icon, 14)}<span>${s.label}</span>
      </button>`).join('');
  }

  function outputPane() {
    const s = getSettings();
    const mode = s.outputMode || 'beside';
    const custom = s.customFolder || '';
    return `
      <div class="settings-section">
        <h3 class="settings-title">Finished files</h3>
        <p class="settings-sub">Choose where Wheel and Form puts everything it makes.</p>
        <div class="output-options">
          <label class="radio-row ${mode === 'beside' ? 'active' : ''}" data-output-mode="beside">
            <span class="radio-dot"></span>
            <span class="radio-main">
              <strong>Next to the original</strong>
              <span>The converted file lands beside its source.</span>
            </span>
          </label>
          <label class="radio-row ${mode === 'custom' ? 'active' : ''}" data-output-mode="custom">
            <span class="radio-dot"></span>
            <span class="radio-main">
              <strong>In a folder I choose</strong>
              <span>Keep every result in one tidy place.</span>
            </span>
          </label>
          <div class="folder-pick" ${mode === 'custom' ? '' : 'hidden'}>
            <span class="folder-path" title="${U.escapeHtml(custom)}">${U.escapeHtml(custom || 'No folder chosen yet')}</span>
            <button class="mini-action" type="button" data-pick-folder>Choose…</button>
          </div>
          <label class="radio-row ${mode === 'ask' ? 'active' : ''}" data-output-mode="ask">
            <span class="radio-dot"></span>
            <span class="radio-main">
              <strong>Ask every time</strong>
              <span>Pick a name and location for each finished file.</span>
            </span>
          </label>
        </div>
      </div>
      <div class="settings-section">
        <div class="switch-row">
          <div>
            <strong>Show finished files in Explorer</strong>
            <span>Open the folder after a conversion completes.</span>
          </div>
          <button class="switch ${s.revealAfter ? 'on' : ''}" type="button" role="switch" aria-checked="${s.revealAfter ? 'true' : 'false'}" data-toggle-reveal aria-label="Show finished files in Explorer"></button>
        </div>
      </div>
      <div class="settings-section">
        <div class="switch-row">
          <div>
            <strong>Desktop wheel</strong>
            <span>Hold Shift, Control or Alt while dragging a file anywhere on your desktop.</span>
          </div>
          <button class="switch ${s.desktopWheel ? 'on' : ''}" type="button" role="switch" aria-checked="${s.desktopWheel ? 'true' : 'false'}" data-toggle-desktop aria-label="Desktop wheel"></button>
        </div>
      </div>
      <div class="settings-section">
        <h3 class="settings-title">Preferences file</h3>
        <p class="settings-sub">Your choices live in a small JSON file. Nothing is sent anywhere.</p>
        <button class="mini-action" type="button" data-open-settings-file>Open settings folder</button>
      </div>`;
  }

  function engineRow(id) {
    const engine = engineMeta(id);
    const status = getStatus()[id] || {};
    const ok = Boolean(status.ok);
    const a = app();
    const installing = a && a.state.installing === id;
    return `
      <div class="engine-row ${ok ? 'ok' : 'missing'}" data-engine-row="${id}">
        <span class="engine-dot"></span>
        <div class="engine-info">
          <div class="engine-name">${U.escapeHtml(engine.name || id)}${engine.optional ? '<span class="badge">Optional</span>' : ''}</div>
          <div class="engine-path" title="${U.escapeHtml(status.found || engine.desc || '')}">${U.escapeHtml(ok ? status.found : (installing ? 'Installing…' : 'Not installed · ' + (engine.desc || '')))}</div>
        </div>
        <div class="engine-actions">
          ${installing
            ? '<button class="mini-action" type="button" disabled>Working…</button>'
            : `${ok ? '' : `<button class="mini-action primary" type="button" data-install-engine="${id}">Install</button>`}
               <button class="mini-action" type="button" data-locate-engine="${id}">Locate</button>`}
        </div>
      </div>`;
  }

  function enginesPane() {
    const a = app();
    const state = a ? a.state : {};
    const engines = a ? a.ENGINES : [];
    const log = state.installLog || '';
    return `
      <div class="settings-section">
        <div class="settings-head-row">
          <div>
            <h3 class="settings-title">Conversion engines</h3>
            <p class="settings-sub">Wheel and Form drives these free tools. Install only the ones you need.</p>
          </div>
          <button class="mini-action" type="button" data-refresh-engines>Check again</button>
        </div>
        <div class="engine-list">
          ${engines.map((e) => engineRow(e.id)).join('')}
        </div>
      </div>
      ${state.installing ? `
        <div class="settings-section">
          <h3 class="settings-title">Installing ${U.escapeHtml(engineMeta(state.installing).name)}</h3>
          <p class="settings-sub">winget is downloading the engine in the background. You can close this window.</p>
          <pre class="install-log" id="settingsInstallLog">${U.escapeHtml(log)}</pre>
        </div>` : ''}
      <div class="settings-section">
        <div class="switch-row">
          <div>
            <strong>Custom install location?</strong>
            <span>Use Locate to point Wheel and Form at an existing executable.</span>
          </div>
          <button class="mini-action" type="button" data-open-settings-file>Open settings file</button>
        </div>
      </div>`;
  }

  function updateView(s) {
    const version = s.version ? `v${s.version}` : '';
    const current = (app() && app().state.appInfo && app().state.appInfo.version) || s.currentVersion || '';
    const percent = Math.round(Number(s.percent) || 0);
    switch (s.status) {
      case 'checking':
        return { tone: 'busy', title: 'Checking for updates…', copy: 'Asking GitHub Releases for the newest build.', tag: current ? `v${current}` : '', actions: '', busy: true };
      case 'available':
        return { tone: 'ready', title: version ? `${version} is ready` : 'An update is ready', copy: 'Download it now. Nothing changes until you choose to restart.', tag: version, actions: `<button class="mini-action primary" type="button" data-update-download>Download update</button>`, busy: false };
      case 'downloading':
        return { tone: 'busy', title: version ? `Downloading ${version}…` : 'Downloading update…', copy: `${percent}% complete. You can keep working while it downloads.`, tag: `${percent}%`, actions: `<button class="mini-action" type="button" disabled>Downloading ${percent}%</button>`, busy: true };
      case 'downloaded':
        return { tone: 'ready', title: version ? `${version} is ready to install` : 'Update ready to install', copy: 'Restart Wheel and Form to finish. Your queue, files and settings stay put.', tag: version, actions: `<button class="mini-action primary" type="button" data-update-install>Restart and install</button>`, busy: false };
      case 'not-available':
        return { tone: 'ok', title: 'You are up to date', copy: current ? `Version ${current} is the newest build on the stable channel.` : 'This is the newest build on the stable channel.', tag: current ? `v${current}` : '', actions: '', busy: false };
      case 'error':
        return { tone: 'bad', title: 'Update check failed', copy: s.error || 'Wheel and Form could not reach the update service. Check your connection and try again.', tag: '', actions: `<button class="mini-action" type="button" data-update-check>Try again</button>`, busy: false };
      case 'dev':
        return { tone: 'idle', title: 'Updates run in the installed app', copy: 'This development build does not check for releases. The installed build checks automatically.', tag: 'DEV', actions: '', busy: false };
      case 'loading':
        return { tone: 'busy', title: 'Reading update status…', copy: 'One moment.', tag: current ? `v${current}` : '', actions: '', busy: true };
      default:
        return { tone: 'idle', title: 'Automatic updates are on', copy: 'Wheel and Form checks at launch and every six hours. Nothing installs without your click.', tag: current ? `v${current}` : '', actions: '', busy: false };
    }
  }

  function updatesPane() {
    const s = (window.UpdateUI && window.UpdateUI.getState()) || { status: 'loading', percent: 0 };
    const view = updateView(s);
    const current = (app() && app().state.appInfo && app().state.appInfo.version) || s.currentVersion || '0.2.0';
    const showProgress = s.status === 'downloading' || s.status === 'downloaded';
    const percent = Math.round(Number(s.percent) || 0);
    return `
      <div class="settings-section" data-update-pane>
        <div class="settings-head-row">
          <div>
            <h3 class="settings-title">App updates</h3>
            <p class="settings-sub">Wheel and Form can fetch a newer build from GitHub Releases and install it for you.</p>
          </div>
          <button class="mini-action" type="button" data-update-check ${view.busy ? 'disabled' : ''}>Check now</button>
        </div>
        <div class="update-panel ${view.tone}">
          <div class="update-panel-top">
            <span class="update-indicator"></span>
            <div class="update-panel-copy">
              <strong data-update-title>${U.escapeHtml(view.title)}</strong>
              <span data-update-copy>${U.escapeHtml(view.copy)}</span>
            </div>
            <span class="update-tag" data-update-tag>${U.escapeHtml(view.tag)}</span>
          </div>
          <div class="update-progress" data-update-progress ${showProgress ? '' : 'hidden'}><span data-update-fill style="width:${percent}%"></span></div>
          <div class="update-actions" data-update-actions>${view.actions}</div>
        </div>
      </div>
      <div class="settings-section">
        <h3 class="settings-title">Current build</h3>
        <div class="about-meta update-meta">
          <div><span>Version</span><strong>${U.escapeHtml(current)}</strong></div>
          <div><span>Channel</span><strong>Stable</strong></div>
          <div><span>Checks</span><strong>Every 6 hours</strong></div>
        </div>
        <p class="settings-sub update-note">Downloads are verified against the release checksum before they run. Your files and preferences are never touched by an update.</p>
      </div>`;
  }

  function syncUpdatesPane(s) {
    const pane = $('[data-update-pane]');
    if (!pane) return;
    const view = updateView(s);
    const panel = $('.update-panel', pane);
    if (panel) panel.className = `update-panel ${view.tone}`;
    const title = $('[data-update-title]', pane);
    if (title) title.textContent = view.title;
    const copy = $('[data-update-copy]', pane);
    if (copy) copy.textContent = view.copy;
    const tag = $('[data-update-tag]', pane);
    if (tag) tag.textContent = view.tag;
    const percent = Math.round(Number(s.percent) || 0);
    const progress = $('[data-update-progress]', pane);
    if (progress) {
      progress.hidden = !(s.status === 'downloading' || s.status === 'downloaded');
      const fill = $('[data-update-fill]', pane);
      if (fill) fill.style.width = `${s.status === 'downloaded' ? 100 : percent}%`;
    }
    const actions = $('[data-update-actions]', pane);
    if (actions) actions.innerHTML = view.actions;
    document.querySelectorAll('[data-update-check]').forEach((btn) => { btn.disabled = view.busy; });
  }

  function aboutPane() {
    const a = app();
    const info = (a && a.state.appInfo) || {};
    return `
      <div class="settings-about">
        <img class="about-brand" src="../assets/brand.svg" alt="Wheel and Form">
        <h3 class="about-title">Wheel <span>and Form</span></h3>
        <p class="about-copy">A local-first file workshop for Windows. Drop a file, choose a format, and keep moving — no uploads, no accounts, no browser tab.</p>
        <div class="about-badges">
          <span>${U.icon('lock', 11)} Local only</span>
          <span>${U.icon('wand', 11)} 26 tools</span>
          <span>${U.icon('zap', 11)} Keyboard-first</span>
        </div>
        <div class="about-meta">
          <div><span>Version</span><strong>${U.escapeHtml(info.version || '0.1.0')}</strong></div>
          <div><span>Electron</span><strong>${U.escapeHtml(info.electron || '—')}</strong></div>
          <div><span>Platform</span><strong>Windows</strong></div>
        </div>
        <div class="about-links">
          <button class="mini-action" type="button" data-open-updates>Check for updates</button>
          <button class="mini-action" type="button" data-open-settings-file>Show preferences file</button>
        </div>
        <p class="about-fine">Built in the workshop. Your files never leave this PC.</p>
      </div>`;
  }

  function paneMarkup() {
    if (section === 'engines') return enginesPane();
    if (section === 'updates') return updatesPane();
    if (section === 'about') return aboutPane();
    return outputPane();
  }

  function modalMarkup() {
    return `
      <section class="modal-card wide settings-card" role="dialog" aria-modal="true" aria-label="Wheel and Form settings">
        <header class="modal-head">
          ${headIcon()}
          <div class="modal-head-copy">
            <div class="modal-kicker">Preferences</div>
            <h2 class="modal-title">Settings</h2>
            <p class="modal-desc">Make Wheel and Form yours. Everything is stored on this PC.</p>
          </div>
          <button class="modal-close" type="button" data-settings-close aria-label="Close settings">${U.icon('x', 15)}</button>
        </header>
        <div class="modal-body settings-body">
          <div class="settings-layout">
            <nav class="settings-nav" aria-label="Settings sections">${navMarkup()}</nav>
            <div class="settings-pane" id="settingsPane">${paneMarkup()}</div>
          </div>
        </div>
        <footer class="modal-foot">
          <div class="modal-foot-left">${U.icon('lock', 12)}<span>Changes save automatically · Local only</span></div>
          <button class="btn btn-primary btn-sm" type="button" data-settings-close>Done</button>
        </footer>
      </section>`;
  }

  // ------------------------------------------------------------------- wire

  function renderPane() {
    const pane = $('#settingsPane');
    if (pane) pane.innerHTML = paneMarkup();
    document.querySelectorAll('[data-settings-section]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.settingsSection === section);
    });
  }

  async function refreshEngineStatus() {
    try {
      const status = await api.tools.status();
      const a = app();
      if (a) a.state.engineStatus = status || {};
      if (a) {
        a.renderEnginesSidebar();
        a.renderEnginePill();
      }
      if (section === 'engines') renderPane();
    } catch (err) {
      window.AppUI.toast(err.message || 'Could not read engine status.', 'error');
    }
  }

  async function installEngine(id) {
    const a = app();
    if (!a || a.state.installing) return;
    a.state.installing = id;
    a.state.installLog = '';
    if (section === 'engines') renderPane();
    const meta = engineMeta(id);
    window.AppUI.toast(`Installing ${meta.name} with winget…`, 'info');
    try {
      const res = await api.tools.install(id);
      if (res && res.status) a.state.engineStatus = res.status;
      else await refreshEngineStatus();
      a.state.installing = null;
      a.state.installLog = null;
      a.renderEnginesSidebar();
      a.renderEnginePill();
      if (section === 'engines') renderPane();
      if (res && res.ok) window.AppUI.toast(`${meta.name} is ready.`, 'success');
      else window.AppUI.toast(res && res.error ? res.error : `${meta.name} was not installed. Check the log.`, 'error');
    } catch (err) {
      a.state.installing = null;
      if (section === 'engines') renderPane();
      window.AppUI.toast(err.message || `Could not install ${meta.name}.`, 'error');
    }
  }

  async function checkUpdates() {
    if (!window.UpdateUI) return;
    const result = await window.UpdateUI.check(true);
    if (result.status === 'not-available') {
      window.AppUI.toast('You are on the latest version.', 'success');
    } else if (result.status === 'error') {
      window.AppUI.toast(result.error || 'Could not check for updates.', 'error');
    } else if (result.status === 'dev') {
      window.AppUI.toast('Update checks run in the installed build.', 'info');
    }
  }

  async function locateEngine(id) {
    const a = app();
    if (!a) return;
    try {
      const res = await api.tools.locate(id);
      if (!res || !res.ok) return;
      const status = res.status || await api.tools.status();
      a.state.engineStatus = status || {};
      a.renderEnginesSidebar();
      a.renderEnginePill();
      if (section === 'engines') renderPane();
      window.AppUI.toast(`${engineMeta(id).name} linked.`, 'success');
    } catch (err) {
      window.AppUI.toast(err.message || 'Could not link that tool.', 'error');
    }
  }

  async function pickFolder() {
    try {
      const folder = await api.settings.pickFolder();
      if (!folder) return;
      await save({ customFolder: folder, outputMode: 'custom' });
      if (section === 'output') renderPane();
    } catch (err) {
      window.AppUI.toast(err.message || 'Could not use that folder.', 'error');
    }
  }

  function wire(root) {
    if (!root || root.dataset.settingsWired === '1') return;
    root.dataset.settingsWired = '1';

    root.addEventListener('click', async (event) => {
      const close = event.target.closest('[data-settings-close]');
      if (close) {
        window.AppUI.closeModal();
        return;
      }
      const nav = event.target.closest('[data-settings-section]');
      if (nav) {
        section = nav.dataset.settingsSection;
        const a = app();
        if (a) a.state.settingsSection = section;
        renderPane();
        if (section === 'engines') refreshEngineStatus();
        return;
      }
      const modeBtn = event.target.closest('[data-output-mode]');
      if (modeBtn) {
        const mode = modeBtn.dataset.outputMode;
        if (mode === 'custom' && !getSettings().customFolder) {
          await pickFolder();
          return;
        }
        await save({ outputMode: mode });
        renderPane();
        return;
      }
      if (event.target.closest('[data-pick-folder]')) {
        await pickFolder();
        return;
      }
      if (event.target.closest('[data-toggle-reveal]')) {
        const next = !getSettings().revealAfter;
        await save({ revealAfter: next });
        renderPane();
        return;
      }
      if (event.target.closest('[data-toggle-desktop]')) {
        const next = !getSettings().desktopWheel;
        await save({ desktopWheel: next });
        renderPane();
        return;
      }
      const install = event.target.closest('[data-install-engine]');
      if (install) {
        await installEngine(install.dataset.installEngine);
        return;
      }
      const locate = event.target.closest('[data-locate-engine]');
      if (locate) {
        await locateEngine(locate.dataset.locateEngine);
        return;
      }
      if (event.target.closest('[data-refresh-engines]')) {
        await refreshEngineStatus();
        window.AppUI.toast('Engine status refreshed.', 'info');
        return;
      }
      if (event.target.closest('[data-open-updates]')) {
        section = 'updates';
        const a = app();
        if (a) a.state.settingsSection = section;
        renderPane();
        return;
      }
      if (event.target.closest('[data-update-check]')) {
        await checkUpdates();
        return;
      }
      if (event.target.closest('[data-update-download]')) {
        await window.UpdateUI.download();
        return;
      }
      if (event.target.closest('[data-update-install]')) {
        await window.UpdateUI.install();
        return;
      }
      if (event.target.closest('[data-open-settings-file]')) {
        const res = await api.app.openSettingsFile();
        if (!res || !res.ok) window.AppUI.toast('Could not open the settings folder.', 'error');
        return;
      }
      const urlBtn = event.target.closest('[data-open-url]');
      if (urlBtn) {
        api.app.openExternal(urlBtn.dataset.openUrl);
        return;
      }
    });
  }

  function open(startSection) {
    section = SECTIONS.some((s) => s.id === startSection) ? startSection : 'output';
    const a = app();
    if (!a) return;
    a.state.settingsSection = section;
    window.AppUI.openModal(modalMarkup());
    wire($('#modalRoot'));
    if (section === 'engines') refreshEngineStatus();
  }

  if (api.app && api.app.onOpenSettings) {
    api.app.onOpenSettings(() => open('output'));
  }

  if (window.UpdateUI) {
    window.UpdateUI.subscribe((next) => {
      if (section === 'updates') syncUpdatesPane(next);
    });
  }

  window.SettingsUI = {
    open,
    openSection: open,
    refreshEngineStatus
  };
})();
