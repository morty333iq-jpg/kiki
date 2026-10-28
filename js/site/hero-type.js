/* hero-type: как на sharplink.com — буквы растворяются вокруг курсора (радиальная маска),
   проявляется пунктирный контур самих глифов с рамками, а за курсором ходит треугольник
   из трёх вершин с подписями координат (в % от блока). */
(function () {
  const root = document.getElementById('hero-type');
  if (!root) return;
  const line = root.querySelector('.hero-type-line');
  const cv = root.querySelector('canvas');
  const ctx = cv.getContext('2d');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Настройки эффекта
  const RADIUS = 1.05;               // радиус растворения (в размерах шрифта)
  const FOLLOW = [0.14, 0.10, 0.07]; // плавность перелёта вершин треугольника
  const SEP = 0.3;                   // минимальное расстояние между вершинами (в размерах шрифта)
  const RETARGET = 0.07;             // на сколько сдвинуть курсор, чтобы вершины выбрали новые точки
  const GLYPHS = window.HERO_GLYPHS || {};

  // Разбиваем текст на слова и буквы
  const text = line.textContent.trim();
  line.setAttribute('aria-label', text);
  line.innerHTML = text.split(/\s+/).map(w =>
    '<span class="hero-type-word" aria-hidden="true">' + [...w].map(c => '<span>' + c + '</span>').join('') + '</span>'
  ).join('');
  const spans = [...line.querySelectorAll('.hero-type-word span')];

  // Подгоняем размер шрифта под ширину блока
  let fs = 100, bs = 70; // размер шрифта и квадрата вершины
  function fit() {
    const stacked = innerWidth <= 700;
    const avail = root.clientWidth - (stacked ? 32 : 48);
    line.style.fontSize = '100px';
    const natural = stacked
      ? Math.max(...[...line.children].map(w => w.getBoundingClientRect().width))
      : line.getBoundingClientRect().width;
    fs = 100 * avail / natural * 0.99;
    line.style.fontSize = fs.toFixed(2) + 'px';
    bs = Math.max(40, Math.min(70, fs * 0.36));
    spans.forEach(s => s.style.setProperty('--r', (fs * RADIUS).toFixed(0) + 'px'));
  }

  let W, H, dpr;
  function resize() {
    fit();
    dpr = devicePixelRatio || 1;
    W = root.clientWidth; H = root.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize);
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(resize);
  resize();

  // Курсор и состояние
  const mouse = { x: 0, y: 0, on: false };
  const center = { x: 0, y: 0 };
  const verts = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
  const targets = [null, null, null];
  const lastPick = { x: -1e9, y: -1e9 };
  let s = 0; // сила эффекта 0..1
  addEventListener('pointermove', e => {
    const r = root.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    const inside = e.clientY > r.top - 60 && e.clientY < r.bottom;
    if (inside && !mouse.on) { center.x = mouse.x; center.y = mouse.y; verts.forEach(v => { v.x = mouse.x; v.y = mouse.y; }); }
    mouse.on = inside;
  });
  const off = () => { mouse.on = false; };
  addEventListener('pointerup', off);
  addEventListener('pointercancel', off);
  addEventListener('touchend', off, { passive: true });
  addEventListener('touchcancel', off, { passive: true });
  addEventListener('scroll', () => { if (matchMedia('(hover: none)').matches) off(); }, { passive: true });
  document.addEventListener('pointerleave', off);

  function rgb(c) {
    c = (c || '').trim();
    if (c[0] === '#') { if (c.length === 4) c = '#' + [...c.slice(1)].map(x => x + x).join(''); const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    const m = c.match(/\d+/g); return m ? m.slice(0, 3).map(Number) : [41, 43, 50];
  }

  let visible = false, running = false, dirty = false;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !running) loop(); }).observe(root);

  function loop(t) {
    if (!visible) { running = false; return; }
    running = true;
    t = t || performance.now();
    const rr = root.getBoundingClientRect();
    const [R, G, B] = rgb(getComputedStyle(root).getPropertyValue('--site-ink'));
    const col = a => 'rgba(' + R + ',' + G + ',' + B + ',' + a + ')';

    s += ((mouse.on ? 1 : 0) - s) * 0.1;
    const active = s > 0.003;
    ctx.clearRect(0, 0, W, H);

    if (active || dirty) {
      // сглаженный центр эффекта
      center.x += (mouse.x - center.x) * 0.2; center.y += (mouse.y - center.y) * 0.2;

      // метрики шрифта и положение каждой буквы (точка начала и базовая линия)
      const cs0 = getComputedStyle(spans[0]);
      ctx.font = cs0.fontWeight + ' ' + cs0.fontSize + ' ' + cs0.fontFamily;
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.textBaseline = 'alphabetic';
      const fm = ctx.measureText('x');
      const asc = fm.fontBoundingBoxAscent || fs * 0.9, desc = fm.fontBoundingBoxDescent || fs * 0.25;
      const org = spans.map(sp => {
        const r = sp.getBoundingClientRect();
        return { sp, r, x: r.left - rr.left, base: r.top - rr.top + (r.height - (asc + desc)) / 2 + asc };
      });

      // вершины треугольника: прилипают к реальным точкам контуров букв рядом с курсором
      if (mouse.on && (!targets[0] || Math.hypot(mouse.x - lastPick.x, mouse.y - lastPick.y) > fs * RETARGET)) {
        const cands = [];
        org.forEach(o => {
          const g = GLYPHS[o.sp.textContent]; if (!g) return;
          g.forEach(c => c.p.forEach(pt => cands.push({ x: o.x + pt[0] * fs, y: o.base - pt[1] * fs })));
        });
        cands.sort((p, q) => Math.hypot(p.x - mouse.x, p.y - mouse.y) - Math.hypot(q.x - mouse.x, q.y - mouse.y));
        // вершины далеко друг от друга: минимум 1.7 размера квадрата и не на одной прямой
        const sep = Math.max(bs * 1.7, fs * SEP), pick = [];
        const area = (a, b, c) => Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
        for (const c of cands) {
          if (!pick.every(p => Math.hypot(p.x - c.x, p.y - c.y) >= sep)) continue;
          if (pick.length === 2 && area(pick[0], pick[1], c) < sep * sep * 0.3) continue;
          pick.push(c);
          if (pick.length === 3) break;
        }
        if (pick.length === 3) { pick.forEach((p, i) => targets[i] = p); lastPick.x = mouse.x; lastPick.y = mouse.y; }
      }
      verts.forEach((v, i) => {
        const tg = targets[i] || mouse;
        v.x += (tg.x - v.x) * FOLLOW[i]; v.y += (tg.y - v.y) * FOLLOW[i];
      });

      // растворение букв: радиальная маска вокруг курсора
      spans.forEach(sp => {
        const r = sp.getBoundingClientRect();
        sp.style.setProperty('--x', (center.x - (r.left - rr.left)).toFixed(1) + 'px');
        sp.style.setProperty('--y', (center.y - (r.top - rr.top)).toFixed(1) + 'px');
        sp.style.setProperty('--s', s.toFixed(3));
      });
      dirty = active;

      if (active) {
        const reach = fs * RADIUS;
        const grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, reach * 1.1);
        grad.addColorStop(0, col(0.85)); grad.addColorStop(0.55, col(0.45)); grad.addColorStop(1, col(0));
        ctx.globalAlpha = Math.min(1, s * 1.3);
        ctx.strokeStyle = grad; ctx.lineWidth = 1.4; ctx.lineCap = 'round';

        org.forEach(o => {
          const cx = o.x + o.r.width / 2, cy = o.r.top - rr.top + o.r.height / 2;
          if (Math.hypot(cx - center.x, cy - center.y) > reach * 1.5) return;
          // пунктирный контур самой буквы
          ctx.setLineDash([1.5, 4.5]);
          ctx.strokeText(o.sp.textContent, o.x, o.base);
          // пунктирные рамки вокруг каждого контура глифа (у «i» отдельно точка и ножка)
          ctx.setLineDash([2, 4]);
          (GLYPHS[o.sp.textContent] || []).forEach(c => {
            const b = c.b;
            ctx.strokeRect(o.x + b[0] * fs, o.base - b[3] * fs, (b[2] - b[0]) * fs, (b[3] - b[1]) * fs);
          });
        });

        // треугольник между вершинами
        ctx.strokeStyle = col(0.7); ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(verts[0].x, verts[0].y); ctx.lineTo(verts[1].x, verts[1].y); ctx.lineTo(verts[2].x, verts[2].y); ctx.closePath(); ctx.stroke();

        // квадраты в вершинах с координатами в %
        ctx.setLineDash([]); ctx.strokeStyle = col(0.55); ctx.fillStyle = col(0.85);
        ctx.font = '11px ui-monospace, Menlo, monospace';
        verts.forEach(v => {
          ctx.strokeRect(v.x - bs / 2, v.y - bs / 2, bs, bs);
          ctx.fillText(Math.round(v.x / W * 100) + ', ' + Math.round(100 - v.y / H * 100), v.x - bs / 2 + 5, v.y + bs / 2 - 7);
        });
        ctx.globalAlpha = 1;
      }
    }
    requestAnimationFrame(loop);
  }
})();
