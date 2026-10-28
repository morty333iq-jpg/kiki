// Gmail block: when the stage scrolls into view the letter is typed,
// the reply chance counts up to 100% and the status steps tick one by one.
// Leaving the screen resets everything, so it plays again next time.
(function () {
  'use strict';
  const stage = document.querySelector('[data-mail-stage]');
  if (!stage) return;
  const typeEl = stage.querySelector('[data-mail-type]');
  const countEl = stage.querySelector('[data-mail-count]');
  const bar = stage.querySelector('[data-mail-bar]');
  const steps = [...stage.querySelectorAll('[data-step]')];
  const t = window.KIKI_TRANSLATIONS || {};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timers = [];
  let raf = 0;
  let playing = false;

  const text = () => (t[document.documentElement.lang] || t.en || {}).mailBody || '';
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(raf);
    stage.classList.remove('play');
    typeEl.textContent = '';
    countEl.textContent = '0%';
    bar.style.width = '0%';
    steps.forEach((s) => s.classList.remove('on'));
    playing = false;
  }

  function count(ms) {
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      countEl.textContent = Math.round(e * 100) + '%';
      bar.style.width = e * 100 + '%';
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function play() {
    reset();
    playing = true;
    stage.classList.add('play');
    const full = text();
    if (reduce) {
      typeEl.textContent = full;
      countEl.textContent = '100%';
      bar.style.width = '100%';
      steps.forEach((s) => s.classList.add('on'));
      return;
    }
    let i = 0;
    const type = () => {
      typeEl.textContent = full.slice(0, ++i);
      if (i < full.length) later(type, full[i - 1] === ' ' ? 18 : 28 + Math.random() * 30);
      else done();
    };
    later(type, 700);
    later(() => steps[0].classList.add('on'), 900);
    function done() {
      later(() => steps[1].classList.add('on'), 250);
      later(() => steps[2].classList.add('on'), 800);
      later(() => count(1400), 900);
      later(() => steps[3].classList.add('on'), 1500);
    }
  }

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting && !playing) play();
        else if (!e.isIntersecting && playing) reset();
      }),
    { threshold: 0.35 },
  );
  io.observe(stage);
  document.addEventListener('kiki:language', () => playing && play());

  // Copy address
  const copyBtn = document.querySelector('[data-mail-copy]');
  if (copyBtn) {
    const em = copyBtn.querySelector('em');
    const addr = em.textContent;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(addr);
      } catch (e) {
        const ta = Object.assign(document.createElement('textarea'), { value: addr });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      const lang = (t[document.documentElement.lang] || t.en || {}).mailCopied || 'Copied!';
      em.textContent = lang;
      copyBtn.classList.add('copied');
      setTimeout(() => {
        em.textContent = addr;
        copyBtn.classList.remove('copied');
      }, 1600);
    });
  }
})();
