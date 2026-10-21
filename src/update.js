'use strict';

(function () {
  const U = window.UI;
  const api = window.api;
  const $ = (sel, root = document) => root.querySelector(sel);

  let state = {
    status: 'loading',
    currentVersion: '',
    version: null,
    percent: 0,
    error: ''
  };
  const listeners = new Set();
  const announced = new Set();

  function emit() {
    listeners.forEach((fn) => {
      try { fn({ ...state }); } catch { /* keep the update flow alive */ }
    });
    document.dispatchEvent(new CustomEvent('wheelandform:update', { detail: { ...state } }));
  }

  function applyState(next) {
    if (!next || typeof next !== 'object') return;
    const before = state;
    state = { ...state, ...next };
    renderPill();
    emit();

    const version = state.version || '';
    if (state.status === 'available' && before.status !== 'available') {
      const key = `available:${version}`;
      if (!announced.has(key)) {
        announced.add(key);
        const label = version ? `Version ${version} is available.` : 'A new version is available.';
        window.AppUI.toast(label, 'info', { label: 'Download', action: download });
      }
    }
    if (state.status === 'downloaded' && before.status !== 'downloaded') {
      const key = `downloaded:${version}`;
      if (!announced.has(key)) {
        announced.add(key);
        window.AppUI.toast('Update ready. Restart to finish.', 'success', { label: 'Restart', action: install });
      }
    }
  }

  function renderPill() {
    const pill = $('#updatePill');
    if (!pill) return;
    const visible = ['available', 'downloading', 'downloaded'].includes(state.status);
    pill.hidden = !visible;
    if (!visible) return;

    const percent = Math.round(Number(state.percent) || 0);
    let icon = 'download';
    let label = 'Update';
    let title = state.version ? `Update ${state.version} is available` : 'Update available';
    if (state.status === 'downloading') {
      icon = 'loader';
      label = `${percent}%`;
      title = `Downloading update — ${percent}%`;
    } else if (state.status === 'downloaded') {
      icon = 'refresh';
      label = 'Restart';
      title = 'Update downloaded — restart to install';
    }

    pill.className = `update-pill${state.status === 'downloaded' ? ' ready' : ''}${state.status === 'downloading' ? ' busy' : ''}`;
    pill.title = title;
    pill.setAttribute('aria-label', title);
    pill.innerHTML = `${U.icon(icon, 12)}<span>${U.escapeHtml(label)}</span>`;
  }

  async function check(manual = false) {
    try {
      const result = await api.update.check(manual);
      applyState(result);
      return state;
    } catch (err) {
      state = { ...state, status: 'error', error: err.message || 'Could not check for updates.' };
      renderPill();
      emit();
      return state;
    }
  }

  async function download() {
    try {
      const result = await api.update.download();
      applyState(result);
      return state;
    } catch (err) {
      state = { ...state, status: 'error', error: err.message || 'Could not download the update.' };
      renderPill();
      emit();
      window.AppUI.toast(state.error, 'error');
      return state;
    }
  }

  async function install() {
    try {
      const result = await api.update.install();
      if (result && result.ok === false) {
        window.AppUI.toast(result.error || 'The update could not start.', 'error');
      }
      return result;
    } catch (err) {
      window.AppUI.toast(err.message || 'The update could not start.', 'error');
      return { ok: false, error: err.message };
    }
  }

  function subscribe(fn) {
    listeners.add(fn);
    try { fn({ ...state }); } catch { /* ignore */ }
    return () => listeners.delete(fn);
  }

  function getState() {
    return { ...state };
  }

  const pill = $('#updatePill');
  if (pill) {
    pill.addEventListener('click', () => {
      if (state.status === 'available') download();
      else if (state.status === 'downloaded') install();
      else if (state.status === 'downloading') window.SettingsUI.open('updates');
      else window.SettingsUI.open('updates');
    });
  }

  if (api.update) {
    api.update.onStatus(applyState);
    api.update.getState().then(applyState).catch(() => {});
  }

  window.UpdateUI = {
    getState,
    check,
    download,
    install,
    subscribe
  };
})();
