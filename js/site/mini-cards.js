(() => {
  'use strict';
  const root = document.getElementById('quick-links');
  if (!root) return;
  const cards = [...root.querySelectorAll('[data-mini-card]')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const quiet = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const copy = {
    ru: { works: 'Работы', services: 'Услуги', about: 'Обо мне', contact: 'Контакт', open: 'Открыть', caption: 'Работы, услуги и контакты — всё рядом.', nav: 'Разделы портфолио' },
    en: { works: 'Work', services: 'Services', about: 'About kiki', contact: 'Contact', open: 'Explore', caption: 'Work, services, and contact — all in one place.', nav: 'Portfolio sections' }
  };
  function translate() {
    const t = copy[document.documentElement.lang === 'ru' ? 'ru' : 'en'];
    root.setAttribute('aria-label', t.nav);
    root.querySelectorAll('[data-mini]').forEach(el => { el.textContent = t[el.dataset.mini]; });
    cards.forEach(card => card.setAttribute('aria-label', t[card.dataset.miniCard] + ': ' + t.open));
  }
  cards.forEach(card => {
    const chip = card.querySelector('.mc-chip');
    let raf = 0, x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0;
    let bounds = { maxX: 0, minY: 0, maxY: 0 };
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function paint() {
      card.style.setProperty('--mc-chip-x', x.toFixed(2) + 'px');
      card.style.setProperty('--mc-chip-y', y.toFixed(2) + 'px');
    }
    function spring() {
      raf = 0;
      if (quiet()) { reset(true); return; }
      // Follow a moving target with a damped spring, not a fixed bottom label.
      vx = (vx + (tx - x) * .15) * .72;
      vy = (vy + (ty - y) * .15) * .72;
      x = clamp(x + vx, -bounds.maxX, bounds.maxX);
      y = clamp(y + vy, bounds.minY, bounds.maxY);
      paint();
      if (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) > .06) {
        raf = requestAnimationFrame(spring);
      } else { x = tx; y = ty; vx = vy = 0; paint(); }
    }
    function measure() {
      const width = card.clientWidth, height = card.clientHeight;
      const half = chip.offsetHeight / 2;
      const mobile = matchMedia("(max-width:600px)").matches;
      const baseY = mobile ? height - 8 - half : height + 20 - half;
      bounds.maxX = Math.max(0, width / 2 - chip.offsetWidth / 2 - 9);
      const brandBottom = height * .25 + 12;
      bounds.minY = mobile ? Math.min(0, brandBottom + 8 + half - baseY) : -baseY;
      bounds.maxY = mobile ? 0 : 8;
      return { width, height, baseY };
    }
    function move(e) {
      if (e.pointerType === 'touch') { root.classList.add('is-touch'); reset(true); return; }
      root.classList.remove('is-touch');
      card.classList.add('is-hover');
      const rect = card.getBoundingClientRect();
      const px = clamp(e.clientX - rect.left, 0, rect.width);
      const py = clamp(e.clientY - rect.top, 0, rect.height);
      card.style.setProperty('--mc-x', px / rect.width * 100 + '%');
      card.style.setProperty('--mc-y', py / rect.height * 100 + '%');
      if (quiet()) return;
      const m = measure();
      tx = clamp((px - m.width / 2) * .9, -bounds.maxX, bounds.maxX);
      ty = clamp((py - m.baseY) * (matchMedia("(max-width:600px)").matches ? .72 : 1), bounds.minY, bounds.maxY);
      if (!raf) raf = requestAnimationFrame(spring);
    }
    function reset(immediate = false) {
      card.classList.remove('is-hover');
      card.style.removeProperty('--mc-x');
      card.style.removeProperty('--mc-y');
      tx = ty = 0;
      if (immediate || quiet()) {
        cancelAnimationFrame(raf); raf = 0;
        x = y = vx = vy = 0; paint();
      } else if (!raf) raf = requestAnimationFrame(spring);
    }
    card.addEventListener('pointerenter', move);
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', () => reset());
    card.addEventListener('pointercancel', () => reset(true));
    card.addEventListener('focus', () => { if (card.matches(':focus-visible')) reset(true); });
    reduced.addEventListener('change', () => reset(true));
    window.addEventListener('resize', () => reset(true));
    document.addEventListener('visibilitychange', () => { if (document.hidden) reset(true); });
  });
  root.classList.toggle('is-touch', navigator.maxTouchPoints > 0);
  document.addEventListener('kiki:language', translate);
  translate();
})();
