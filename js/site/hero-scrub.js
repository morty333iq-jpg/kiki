/* hero-scrub: видео первого экрана привязано к скроллу. Прокрутил — кадры идут вперёд, вернулся — назад. */
(() => {
  'use strict';
  const wrap = document.getElementById('scrub-hero');
  const stage = wrap && wrap.querySelector('.welcome-stage');
  const video = stage && stage.querySelector('.hero-landscape video');
  if (!wrap || !video) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return; // без анимации: просто постер

  const SMOOTH = 0.14;     // плавность догоняния кадра (меньше = плавнее, но с запаздыванием)
  const HOLD = 0.92;       // видео доигрывает к этой доле скролла, остаток держится последний кадр
  const END_FROM = 0.8;    // с какого момента скролла самый низ видео переходит в цвет сайта
  const TEXT_FADE = 0.3;   // за какую долю скролла текст полностью исчезает

  wrap.classList.add('scrub-on');
  video.muted = true; video.loop = false; video.playsInline = true; video.preload = 'auto';

  const narrow = matchMedia('(max-width:680px)');
  let ready = false;
  function load() {
    const src = video.dataset[narrow.matches ? 'videoMobile' : 'videoDesktop'];
    if (video.getAttribute('src') !== src) { ready = false; stage.classList.remove('scenery-ready'); video.src = src; video.load(); }
  }
  narrow.addEventListener('change', load);
  video.addEventListener('loadeddata', () => {
    ready = true; stage.classList.add('scenery-ready');
    // «разбудить» декодер (iOS), затем сразу остановить: дальше кадры задаёт скролл
    const p = video.play(); if (p && p.then) p.then(() => video.pause()).catch(() => {}); else video.pause();
  });
  video.addEventListener('error', () => wrap.classList.remove('scrub-on')); // запасной вариант: обычный экран с постером
  load();

  const smooth = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  let cur = 0, visible = true, running = false;

  function progress() {
    const r = wrap.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  }

  function loop() {
    if (!visible) { running = false; return; }
    running = true;
    const target = progress();
    cur += (target - cur) * SMOOTH;
    if (Math.abs(target - cur) < 0.0004) cur = target;

    if (ready && video.duration && !video.seeking) {
      const t = Math.min(1, cur / HOLD) * (video.duration - 0.04);
      if (Math.abs(video.currentTime - t) > 1 / 60) video.currentTime = t;
    }
    const out = smooth(cur / TEXT_FADE);
    wrap.style.setProperty('--out', out.toFixed(3));
    wrap.classList.toggle('scrub-out', out > 0.85);
    // конец скролла: самый низ видео плавно переходит в цвет сайта
    const end = smooth((cur - END_FROM) / (1 - END_FROM));
    wrap.style.setProperty('--end', end.toFixed(3));
    requestAnimationFrame(loop);
  }

  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !running) loop(); }, { rootMargin: '200px' }).observe(wrap);
  loop();
})();
