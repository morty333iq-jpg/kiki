// Fine tick-mark reading progress. Click, drag, or use keyboard to move in a book.
(function () {
  'use strict';
  const ruler = document.createElement('div');
  ruler.className = 'chapter-ruler';
  ruler.tabIndex = 0;
  ruler.setAttribute('role', 'slider');
  ruler.setAttribute('aria-orientation', 'vertical');
  ruler.setAttribute('aria-valuemin', '0');
  ruler.setAttribute('aria-valuemax', '100');
  ruler.innerHTML = '<span class="chapter-ruler-lines" aria-hidden="true"></span>';
  const lines = ruler.firstElementChild;
  const ticks = Array.from({ length: 101 }, (_, i) => {
    const tick = document.createElement('i');
    if (i % 5 === 0) tick.className = 'major';
    lines.append(tick);
    return tick;
  });
  document.body.append(ruler);
  let scheduled = false;
  let dragging = false;
  const range = () => Math.max(0, document.documentElement.scrollHeight - innerHeight);
  function update() {
    const total = range();
    const progress = total ? Math.round(scrollY / total * 100) : 0;
    ticks.forEach((tick, i) => tick.classList.toggle('is-lit', Math.abs(i - progress) <= 2));
    ruler.setAttribute('aria-valuenow', String(progress));
    const ru = document.documentElement.lang === 'ru';
    ruler.setAttribute('aria-label', ru ? 'Положение в книжке' : 'Position in this book');
    ruler.setAttribute('aria-valuetext', `${progress}%`);
    ruler.hidden = total === 0;
    scheduled = false;
  }
  function queue() { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }
  function move(y) {
    const rect = lines.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (y - rect.top) / rect.height));
    scrollTo({ top: ratio * range(), behavior: 'instant' });
  }
  ruler.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault(); ruler.focus({ preventScroll: true });
    dragging = true; ruler.setPointerCapture(e.pointerId); move(e.clientY);
  });
  ruler.addEventListener('pointermove', e => { if (dragging) move(e.clientY); });
  ruler.addEventListener('pointerup', () => { dragging = false; });
  ruler.addEventListener('pointercancel', () => { dragging = false; });
  ruler.addEventListener('lostpointercapture', () => { dragging = false; });
  ruler.addEventListener('keydown', e => {
    let next;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = scrollY + range() / 100;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = scrollY - range() / 100;
    if (e.key === 'PageDown') next = scrollY + innerHeight * .8;
    if (e.key === 'PageUp') next = scrollY - innerHeight * .8;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = range();
    if (next !== undefined) { e.preventDefault(); scrollTo({ top: next, behavior: 'instant' }); }
  });
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  document.addEventListener('kiki:language', queue);
  new ResizeObserver(queue).observe(document.body);
  update();
})();
