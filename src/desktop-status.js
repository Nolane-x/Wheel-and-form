'use strict';

(function () {
  const api = window.api;
  const $ = (sel) => document.querySelector(sel);
  const card = $('#statusCard');
  const mark = $('#statusMark');
  const title = $('#statusTitle');
  const sub = $('#statusSub');
  const bar = $('#statusBar');
  const progress = $('#statusProgress');
  const detail = $('#statusDetail');
  const error = $('#statusError');
  const actions = $('#statusActions');
  const showBtn = $('#statusShow');
  const setupBtn = $('#statusSetup');

  let output = '';
  let state = 'working';

  function setState(next) {
    state = next && next.state ? next.state : 'working';
    card.dataset.state = state;
    title.textContent = next.title || (state === 'working' ? 'Working…' : 'Done');
    sub.textContent = next.subtitle || '';
    sub.hidden = !next.subtitle;
    detail.textContent = next.detail || '';
    detail.hidden = !next.detail;
    error.textContent = next.error || '';
    error.hidden = !next.error;
    output = next.output || '';
    const pct = state === 'working' ? Math.max(0, Math.min(100, Math.round(Number(next.progress) || 0))) : 100;
    bar.hidden = state !== 'working';
    progress.style.width = `${pct}%`;
    actions.hidden = state === 'working';
    showBtn.hidden = !output;
    setupBtn.hidden = !next.setup;
    mark.classList.toggle('spin', state === 'working');
  }

  function close() {
    api.desktop.closeStatus();
  }

  api.desktop.onStatus(setState);

  $('#statusClose').addEventListener('click', close);
  showBtn.addEventListener('click', () => {
    if (output) api.file.reveal(output);
  });
  setupBtn.addEventListener('click', () => {
    api.desktop.openSettings();
    close();
  });

  setState({ state: 'working', title: 'Working…', subtitle: '', progress: 0 });
})();
