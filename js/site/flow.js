// "How a work is born" block: canvas with the artboard and step nodes on the left,
// chat with a client on the right. One simple timeline drives everything.
// It starts when the block is on screen, pauses when it's off screen (never resets mid-way),
// and loops after a short pause. Only cheap animations: opacity, colors, small transforms.
(function () {
  'use strict';
  const root = document.querySelector('[data-flow]');
  const data = window.KIKI_FLOW;
  if (!root || !data) return;
  const canvas = root.querySelector('.flow-canvas');
  const svg = root.querySelector('.flow-lines');
  const log = root.querySelector('.flow-log');
  const color = root.querySelector('.flow-art-color');
  const pct = root.querySelector('[data-flow-pct]');
  const NS = 'http://www.w3.org/2000/svg';
  const MAX_ITEMS = 9;
  let L = data.en;
  let nodes = [];
  let lines = [];
  let events = [];
  let clock = 0;
  let next = 0;
  let visible = false;
  let doneCount = 0;
  let timer = 0;

  const lang = () => (document.documentElement.lang === 'ru' ? 'ru' : 'en');

  function texts() {
    root.querySelectorAll('[data-flow-t]').forEach((el) => (el.innerHTML = L[el.dataset.flowT]));
    root.querySelectorAll('[data-flow-tab]').forEach((el, i) => (el.textContent = L.tabs[i]));
  }

  function build() {
    canvas.querySelectorAll('.flow-node').forEach((n) => n.remove());
    svg.innerHTML = '';
    nodes = [];
    lines = [];
    const n = L.nodes.length;
    const rx = canvas.clientWidth < 480 ? 33 : 38;
    L.nodes.forEach((name, i) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      const x = 50 + Math.cos(a) * rx;
      const y = 50 + Math.sin(a) * 39;
      const el = document.createElement('div');
      el.className = 'flow-node';
      el.style.left = x + '%';
      el.style.top = y + '%';
      el.innerHTML = `<span class="flow-node-dot"></span>${name}`;
      canvas.appendChild(el);
      nodes.push(el);
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', '50');
      line.setAttribute('y1', '50');
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      svg.appendChild(line);
      lines.push(line);
    });
  }

  function progress() {
    const p = doneCount / L.nodes.length;
    color.style.opacity = p;
    pct.textContent = Math.round(p * 100) + '%';
    root.classList.toggle('flow-finished', p >= 1);
  }

  function setNode(i, state) {
    nodes[i].classList.remove('is-running', 'is-done');
    nodes[i].classList.add('is-' + state);
    lines[i].setAttribute('class', state === 'running' ? 'on' : 'done');
    if (state === 'done') {
      doneCount++;
      progress();
    }
  }

  function push(el) {
    log.appendChild(el);
    while (log.children.length > MAX_ITEMS) log.firstElementChild.remove();
    requestAnimationFrame(() => el.classList.add('in'));
  }

  const make = (cls, html) => Object.assign(document.createElement('div'), { className: cls, innerHTML: html });

  // Build the whole timeline once: [{t, fn}]
  function timeline() {
    events = [];
    let t = 600;
    const at = (ms, fn) => events.push({ t: ms, fn });
    L.chat.forEach((m) => {
      const typeMs = Math.min(1400, 600 + m.text.length * 8);
      let typing;
      at(t, () => push((typing = make('flow-typing flow-typing--' + m.from, '<i></i><i></i><i></i>'))));
      t += typeMs;
      at(t, () => {
        typing && typing.remove();
        push(
          make(
            'flow-msg flow-msg--' + m.from,
            m.from === 'kiki' ? `<span class="flow-ava">k</span><p>${m.text}</p>` : `<p>${m.text}</p>`,
          ),
        );
      });
      t += 700;
      if (!m.tasks) return;
      const rows = [];
      m.tasks.forEach(([i, sub], k) => {
        at(t, () => {
          rows[k] = make(
            'flow-task',
            `<span class="flow-spin"></span><b>${L.nodes[i]}</b><small>${sub}</small><em>${L.queued}</em>`,
          );
          push(rows[k]);
        });
        t += 300;
      });
      m.tasks.forEach(([i], k) => {
        at(t, () => {
          rows[k].classList.add('running');
          rows[k].querySelector('em').textContent = L.running;
          setNode(i, 'running');
        });
        t += 1600;
        at(t, () => {
          rows[k].classList.replace('running', 'done');
          rows[k].querySelector('em').textContent = L.done;
          setNode(i, 'done');
        });
        t += 300;
      });
      t += 400;
    });
    at(t + 7000, restart);
  }

  function clear() {
    log.innerHTML = '';
    doneCount = 0;
    nodes.forEach((n) => n.classList.remove('is-running', 'is-done'));
    lines.forEach((l) => l.removeAttribute('class'));
    progress();
    clock = 0;
    next = 0;
  }
  function restart() {
    clear();
  }

  // 100 ms tick that only advances while the block is visible
  function tick() {
    if (!visible || document.hidden) return;
    clock += 100;
    while (next < events.length && events[next].t <= clock) events[next++].fn();
  }

  function init() {
    L = data[lang()];
    texts();
    build();
    timeline();
    clear();
  }
  init();
  timer = setInterval(tick, 100);

  new IntersectionObserver((entries) => entries.forEach((e) => (visible = e.isIntersecting)), {
    threshold: 0.15,
  }).observe(root.querySelector('.flow-stage'));

  document.addEventListener('kiki:language', init);
  let small = canvas.clientWidth < 480;
  window.addEventListener('resize', () => {
    if (canvas.clientWidth < 480 !== small) {
      small = !small;
      init();
    }
  });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clearInterval(timer);
    visible = true;
    events.forEach((e) => e.t < events[events.length - 1].t && e.fn());
  }
})();
