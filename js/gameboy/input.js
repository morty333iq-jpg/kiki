// Buttons from keyboard, mouse and touch. Polled once per 60 Hz frame.
window.Input = (function () {
  'use strict';

  const BTNS = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'];
  const DIRS = ['up', 'down', 'left', 'right'];

  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyX: 'a', KeyK: 'a', Space: 'a',
    KeyZ: 'b', KeyJ: 'b',
    Enter: 'start', NumpadEnter: 'start',
    ShiftLeft: 'select', ShiftRight: 'select', Backspace: 'select',
  };

  const held = {}, frames = {}, queued = {}, pressedNow = {}, sources = {};
  BTNS.forEach(b => { held[b] = false; frames[b] = 0; queued[b] = false; pressedNow[b] = false; sources[b] = new Set(); });

  let dpadEl = null;
  const lastDir = [];

  function visual(btn, on) {
    if (DIRS.includes(btn)) {
      const i = lastDir.indexOf(btn);
      if (i >= 0) lastDir.splice(i, 1);
      if (on) lastDir.push(btn);
      if (dpadEl) dpadEl.dataset.dir = lastDir[lastDir.length - 1] || '';
    } else {
      document.querySelectorAll(`[data-btn="${btn}"]`).forEach(el => el.classList.toggle('is-pressed', on));
    }
  }

  function press(btn, src) {
    const s = sources[btn];
    if (s.has(src)) return;
    s.add(src);
    if (!held[btn]) {
      held[btn] = true;
      queued[btn] = true;
      visual(btn, true);
    }
    if (api.onPress) api.onPress(btn);
  }

  function release(btn, src) {
    const s = sources[btn];
    if (!s.delete(src) || s.size) return;
    held[btn] = false;
    visual(btn, false);
  }

  function releaseAll() {
    BTNS.forEach(b => { sources[b].clear(); held[b] = false; visual(b, false); });
  }

  // ---------- keyboard ----------
  window.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const btn = KEYMAP[e.code];
    if (!btn) return;
    e.preventDefault();
    press(btn, 'k:' + e.code);
  });
  window.addEventListener('keyup', e => {
    const btn = KEYMAP[e.code];
    if (btn) release(btn, 'k:' + e.code);
  });
  window.addEventListener('blur', releaseAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });

  // ---------- pointer (mouse + multitouch) ----------
  function bindButton(el) {
    const btn = el.dataset.btn;
    const src = e => 'p:' + e.pointerId;
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      press(btn, src(e));
    });
    const up = e => release(btn, src(e));
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }

  function bindDpad(el) {
    dpadEl = el;
    const current = new Map(); // pointerId -> dir

    const dirAt = e => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < r.width * 0.08) return current.get(e.pointerId) || null;
      return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    };
    const set = (e, dir) => {
      const src = 'd:' + e.pointerId;
      const prev = current.get(e.pointerId);
      if (prev === dir) return;
      if (prev) release(prev, src);
      if (dir) { current.set(e.pointerId, dir); press(dir, src); } else current.delete(e.pointerId);
    };

    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      set(e, dirAt(e));
    });
    el.addEventListener('pointermove', e => { if (current.has(e.pointerId)) set(e, dirAt(e)); });
    const up = e => set(e, null);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }

  // ---------- per-frame state ----------
  function poll() {
    for (const b of BTNS) {
      pressedNow[b] = queued[b];
      queued[b] = false;
      frames[b] = held[b] ? frames[b] + 1 : 0;
    }
  }

  const api = {
    BTNS,
    onPress: null,
    bindButton,
    bindDpad,
    poll,
    releaseAll,
    down: b => held[b],
    pressed: b => pressedNow[b],
    any: (...bs) => bs.some(b => pressedNow[b]),
    // pressed now, or auto-repeat after `delay` frames every `rate` frames (DAS)
    repeat(b, delay = 16, rate = 6) {
      if (pressedNow[b]) return true;
      const f = frames[b];
      return held[b] && f > delay && (f - delay) % rate === 0;
    },
  };
  return api;
})();
