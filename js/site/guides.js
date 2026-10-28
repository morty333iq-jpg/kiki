/* guides: рисует пунктирные горизонтальные линии на границах блоков (как на sharplink.com).
   Линии лежат в зазоре между блоками, на всю ширину экрана, позади контента. */
(() => {
  'use strict';
  const guided = document.querySelector('.guided');
  if (!guided) return;

  const BLOCKS = ['.site-intro', '.design-studio', '.conversation-banner', '.mail-block', '.site-community',
                  '.word-formats', '.footer-layout', '.footer-bottom', '.hero-type'];
  const GAP = 28; // расстояние между парой линий, как у вертикальных направляющих

  const layer = document.createElement('div');
  layer.className = 'guide-lines';
  layer.setAttribute('aria-hidden', 'true');
  guided.prepend(layer);

  let raf = 0;
  function draw() {
    raf = 0;
    const g = guided.getBoundingClientRect();
    const rects = BLOCKS.map(s => guided.querySelector(s)).filter(Boolean)
      .map(el => el.getBoundingClientRect())
      .filter(r => r.height > 0)
      .map(r => ({ top: r.top - g.top, bottom: r.bottom - g.top }))
      .sort((a, b) => a.top - b.top);

    const ys = [];
    rects.forEach((r, i) => {
      const prevBottom = i ? Math.max(...rects.slice(0, i).map(x => x.bottom)) : 0;
      const gap = r.top - prevBottom;
      if (gap >= GAP + 12) ys.push(r.top - GAP, r.top);          // двойная линия над блоком
      else if (gap > 6) ys.push(prevBottom + gap / 2);            // тесный зазор: одна линия посередине
    });
    const last = rects[rects.length - 1];
    if (last) ys.push(Math.min(last.bottom, g.height - 1));       // нижняя граница последнего блока

    const uniq = [...new Set(ys.map(y => Math.round(y)))].filter(y => y >= 0);
    layer.innerHTML = uniq.map(y => '<i style="top:' + y + 'px"></i>').join('');
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };

  new ResizeObserver(schedule).observe(guided);
  addEventListener('resize', schedule);
  addEventListener('load', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  schedule();
})();
