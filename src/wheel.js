'use strict';

(function () {
  const CENTER = 0;
  const INNER = 49;
  const OUTER = 119.5;
  const BACKDROP = 127.4;
  const GAP = 4;
  const CORNER = 20.2;
  const TAU = Math.PI * 2;

  function angleFor(i, n) {
    return (n === 3 ? Math.PI : Math.PI / 2) - (TAU * i) / n;
  }

  function pt(r, a) {
    return [r * Math.cos(a), -r * Math.sin(a)];
  }

  function fmt(n) {
    return Math.round(n * 100) / 100;
  }

  function petalPath(a0, a1) {
    const span = a1 - a0;
    const radius = Math.min(CORNER, (OUTER - INNER) * 0.38, span * INNER * 0.27, span * OUTER * 0.27);
    const innerPad = Math.max(0.015, radius / INNER);
    const outerPad = Math.max(0.012, radius / OUTER);
    const ia0 = a0 + innerPad;
    const ia1 = a1 - innerPad;
    const oa0 = a0 + outerPad;
    const oa1 = a1 - outerPad;
    const p = (r, a) => `${fmt(pt(r, a)[0])} ${fmt(pt(r, a)[1])}`;
    const d = [
      `M ${p(INNER, ia0)}`,
      `A ${INNER} ${INNER} 0 0 0 ${p(INNER, ia1)}`,
      `Q ${p(INNER, a1)} ${p(INNER + radius, a1)}`,
      `L ${p(OUTER - radius, a1)}`,
      `Q ${p(OUTER, a1)} ${p(OUTER, oa1)}`,
      `A ${OUTER} ${OUTER} 0 0 1 ${p(OUTER, oa0)}`,
      `Q ${p(OUTER, a0)} ${p(OUTER - radius, a0)}`,
      `L ${p(INNER + radius, a0)}`,
      `Q ${p(INNER, a0)} ${p(INNER, ia0)}`,
      'Z'
    ].join(' ');
    return d;
  }

  function labelParts(label) {
    const text = String(label || '');
    if (text.length <= 8 || !text.includes(' ')) return [text];
    const words = text.split(/\s+/);
    let first = '';
    let second = '';
    for (const word of words) {
      if (!first || (first + ' ' + word).length <= 6) first = first ? `${first} ${word}` : word;
      else second = second ? `${second} ${word}` : word;
    }
    return second ? [first, second] : [first];
  }

  class Wheel {
    constructor(root) {
      this.root = root;
      this.svg = root.querySelector('.wheel-svg');
      this.petals = root.querySelector('.wheel-petals');
      this.center = root.querySelector('.wheel-center');
      this.titleEl = root.querySelector('.wheel-title');
      this.subEl = root.querySelector('.wheel-sub');
      this.kickerEl = root.querySelector('.wheel-kicker');
      this.detailEl = root.querySelector('.wheel-detail');
      this.tabsEl = root.querySelector('.wheel-tabs');
      this.keysEl = root.querySelector('.wheel-keys');
      this.options = [];
      this.index = 0;
      this.mode = 'convert';
      this.onSelect = null;
      this.onTab = null;
      this.isOpen = false;
      this.isDrag = false;
      this._closeTimer = null;
      this._bind();
    }

    _bind() {
      this.petals.addEventListener('pointerover', (e) => {
        const group = e.target.closest('.petal-group');
        if (!group) return;
        this.select(Number(group.dataset.index), { silent: true });
      });
      this.petals.addEventListener('click', (e) => {
        const group = e.target.closest('.petal-group');
        if (!group || this.isDrag) return;
        this.choose(Number(group.dataset.index));
      });
      this.tabsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-wheel-tab]');
        if (!btn || !this.onTab) return;
        this.onTab(btn.dataset.wheelTab);
      });
    }

    open(model) {
      if (this._closeTimer) {
        clearTimeout(this._closeTimer);
        this._closeTimer = null;
      }
      this.titleEl.textContent = model.title || 'Choose';
      this.subEl.textContent = model.subtitle || '';
      this.kickerEl.textContent = model.kicker || '';
      this.detailEl.innerHTML = model.detail || '';
      this.onSelect = model.onSelect || null;
      this.onTab = model.onTab || null;
      this.isDrag = Boolean(model.dragMode);
      this.root.classList.toggle('is-drag', this.isDrag);
      this.renderTabs(model.tabs || [], model.mode || 'convert');
      this.setOptions(model.options || [], model.mode || 'convert', model.index || 0);
      this.root.hidden = false;
      this.root.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => {
        this.root.classList.add('is-open');
        this.isOpen = true;
      });
      this.setActiveMode(model.mode || 'convert');
    }

    close() {
      if (!this.isOpen) {
        this.root.hidden = true;
        return;
      }
      this.root.classList.remove('is-open');
      this.isOpen = false;
      this._closeTimer = setTimeout(() => {
        this.root.hidden = true;
        this.root.setAttribute('aria-hidden', 'true');
      }, 190);
    }

    setOptions(options, mode, index = 0) {
      this.options = options.filter(Boolean);
      this.mode = mode || 'convert';
      this.render();
      this.select(Math.max(0, Math.min(index, this.options.length - 1)), { silent: true });
    }

    renderTabs(tabs, active) {
      if (!tabs.length) {
        this.tabsEl.innerHTML = '';
        this.tabsEl.hidden = true;
        return;
      }
      this.tabsEl.hidden = false;
      this.tabsEl.innerHTML = tabs.map((tab) => (
        `<button class="wheel-tab ${tab.id === active ? 'active' : ''}" data-wheel-tab="${tab.id}" type="button">${tab.label}</button>`
      )).join('');
    }

    render() {
      const n = this.options.length;
      this.svg.classList.toggle('dense', n > 8);
      if (!n) {
        this.petals.innerHTML = '';
        this.center.innerHTML = '<div class="hub-empty">Nothing here</div>';
        this.detailEl.textContent = 'There is nothing to choose for this file.';
        return;
      }
      const step = TAU / n;
      const halfGap = GAP / 2 / ((INNER + OUTER) / 2);
      const fontSize = n <= 4 ? 12 : n <= 6 ? 10.5 : n <= 8 ? 9.5 : 9.1;
      const flower = angleFor(0, n);
      const parts = [];
      for (let i = 0; i < n; i++) {
        const centerAngle = angleFor(i, n);
        const a0 = centerAngle - step / 2 + halfGap;
        const a1 = centerAngle + step / 2 - halfGap;
        const mid = (a0 + a1) / 2;
        const pos = pt((INNER + OUTER) / 2, mid);
        let deg = 90 - (mid * 180) / Math.PI;
        deg = ((deg + 180) % 360 + 360) % 360 - 180;
        if (deg > 90 || deg < -90) deg += 180;
        const labels = labelParts(this.options[i].short || this.options[i].label || '');
        const lines = labels.map((line, idx) => (
          `<tspan x="${fmt(pos[0])}" dy="${idx === 0 ? (labels.length > 1 ? -5 : 3.5) : 11}">${this._escape(line)}</tspan>`
        )).join('');
        parts.push(`
          <g class="petal-group" data-index="${i}" style="--i:${i}">
            <path class="petal" d="${petalPath(a0, a1)}"></path>
            <text class="petal-label" x="${fmt(pos[0])}" y="${fmt(pos[1])}" transform="rotate(${fmt(deg)} ${fmt(pos[0])} ${fmt(pos[1])})" style="font-size:${fontSize}px">${lines}</text>
          </g>
        `);
      }
      this.petals.innerHTML = parts.join('');
      this._flower = flower;
      this.select(this.index, { silent: true });
    }

    _escape(text) {
      return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    setActiveMode(mode) {
      this.root.dataset.mode = mode;
      this.tabsEl.querySelectorAll('[data-wheel-tab]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.wheelTab === mode);
      });
      this.keysEl.querySelectorAll('[data-wheel-key]').forEach((key) => {
        key.classList.toggle('active', key.dataset.wheelKey === mode);
      });
    }

    select(index, opts = {}) {
      if (!this.options.length) return;
      const total = this.options.length;
      let i = index;
      let guard = 0;
      while (this.options[i] && this.options[i].disabled && guard < total) {
        i = (i + 1) % total;
        guard++;
      }
      this.index = i;
      const option = this.options[i];
      this.petals.querySelectorAll('.petal-group').forEach((group) => {
        group.classList.toggle('active', Number(group.dataset.index) === i);
      });
      if (!option) return;
      this.center.innerHTML = `
        <div class="hub-icon">${option.hubIcon || ''}</div>
        <div class="hub-label">${this._escape(option.short || option.label || '')}</div>
        <div class="hub-sub">${this._escape(option.hubSub || '')}</div>
      `;
      this.detailEl.innerHTML = option.desc || '';
      if (!opts.silent) {
        this.root.classList.remove('pulse');
        void this.root.offsetWidth;
        this.root.classList.add('pulse');
      }
    }

    cycle(delta) {
      if (!this.options.length) return;
      const total = this.options.length;
      let i = this.index;
      for (let step = 0; step < total; step++) {
        i = (i + delta + total) % total;
        if (!this.options[i].disabled) {
          this.select(i);
          return;
        }
      }
    }

    choose(index) {
      const option = this.options[index];
      if (!option || option.disabled) return;
      if (this.onSelect) this.onSelect(option, index);
    }

    chooseCurrent() {
      this.choose(this.index);
    }

    hitTest(clientX, clientY) {
      if (!this.options.length) return -1;
      const rect = this.svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const radius = Math.hypot(dx, dy) / (rect.width / 280);
      if (radius < INNER - 6 || radius > OUTER + 8) return -1;
      let angle = Math.atan2(-dy, dx);
      if (angle < 0) angle += TAU;
      const n = this.options.length;
      const step = TAU / n;
      let best = -1;
      let bestDelta = Infinity;
      for (let i = 0; i < n; i++) {
        let center = angleFor(i, n) % TAU;
        if (center < 0) center += TAU;
        let delta = Math.abs(angle - center);
        if (delta > Math.PI) delta = TAU - delta;
        if (delta < bestDelta) {
          bestDelta = delta;
          best = i;
        }
      }
      return bestDelta <= step / 2 ? best : -1;
    }

    hoverAt(clientX, clientY) {
      const index = this.hitTest(clientX, clientY);
      if (index >= 0 && index !== this.index) this.select(index, { silent: true });
      return index;
    }

    inside(clientX, clientY) {
      if (!this.isOpen) return false;
      const rect = this.svg.getBoundingClientRect();
      if (!rect.width) return false;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const radius = Math.hypot(clientX - cx, clientY - cy) / (rect.width / 280);
      return radius <= BACKDROP + 12;
    }
  }

  window.Wheel = Wheel;
})();
