(function () {
  var hero = document.getElementById('hero');
  if (!hero) return;
  var idle = hero.querySelector('.kh-idle');
  var cv = hero.querySelector('.kh-canvas');
  var hint = hero.querySelector('.kh-hint');
  var text = hero.querySelector('.kh-text');
  var ctx = cv.getContext('2d');
  var N = 192, W = 1600, H = 900;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var frames = new Array(N);
  var target = 0, shown = -1, cur = 0;
  cv.width = W; cv.height = H;

  function pad(n) { return ('00' + n).slice(-3); }
  function load(i, cb) {
    var im = new Image();
    im.decoding = 'async';
    im.onload = function () { frames[i] = im; if (i === shown) shown = -1; if (cb) cb(im); };
    im.src = 'assets/hero/frames/f' + pad(i + 1) + '.webp';
  }

  if (reduce) { load(N - 1, function (im) { ctx.drawImage(im, 0, 0, W, H); }); return; }
  for (var i = 0; i < N; i++) load(i);

  function draw(f) {
    for (var k = f; k >= 0; k--) {
      if (frames[k]) { if (k !== shown) { ctx.drawImage(frames[k], 0, 0, W, H); shown = k; } return; }
    }
  }
  function progress() {
    var max = hero.offsetHeight - window.innerHeight;
    var y = -hero.getBoundingClientRect().top;
    return max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
  }

  var idlePlaying = true, mix = 0, last = performance.now();
  function tick(now) {
    var p = progress();
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    // idle loop <-> scroll animation: a short time-based dissolve, independent of scroll speed
    var goal = p > 0.004 ? 1 : 0;
    mix += Math.max(-dt / 0.5, Math.min(dt / 0.5, goal - mix));
    mix = Math.min(1, Math.max(0, mix));
    cv.style.opacity = mix;
    idle.style.opacity = 1 - mix;
    if (mix >= 1 && idlePlaying) { idle.pause(); idlePlaying = false; }
    if (mix < 1 && !idlePlaying) { idle.play().catch(function () {}); idlePlaying = true; }
    if (hint) hint.style.opacity = p > 0.02 ? 0 : 1;
    if (text) {                                 // text leaves while the head starts to break
      var t = Math.min(1, p / 0.22);
      text.style.opacity = 1 - t;
      text.style.transform = (window.matchMedia('(max-aspect-ratio: 1/1)').matches ? '' : 'translateY(calc(-50% - ' + (t * 30) + 'px))');
      text.style.pointerEvents = t > 0.6 ? 'none' : '';
    }
    target = Math.min(1, Math.max(0, (p - 0.03) / 0.75)) * (N - 1);   // animation ends at ~78% of the scroll
    cur += (target - cur) * 0.18;
    if (Math.abs(target - cur) < 0.05) cur = target;
    draw(Math.round(cur));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  var T = { ru: 'Скролль', en: 'Scroll' };
  function setLang(l) { if (hint) hint.firstChild.nodeValue = T[l] || T.en; }
  setLang(document.documentElement.lang);
  document.addEventListener('kiki:language', function (e) { setLang(e.detail); });
})();
