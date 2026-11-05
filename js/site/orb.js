/* Particle orb with a hidden word inside. Hover repels the dots, drag spins the sphere (it follows the
   finger/cursor), click squeezes it. Turn it slowly until the word lines up and "kiki" snaps into place.
   Usage: <div class="kiki-orb" data-orb data-word="kiki"><canvas></canvas></div>
   Colors come from --site-ink and --orb-accent. */
(function () {
  function css(name, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; }
  function rgb(c, fb) {
    var m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
    if (m) { var n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    m = /rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(c);
    return m ? [+m[1], +m[2], +m[3]] : fb;
  }
  var TAU = Math.PI * 2;
  function wrap(a) { return ((a % TAU) + 3 * Math.PI) % TAU - Math.PI; }
  function smooth(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }

  // Sample the word from a hidden canvas -> list of [x, y] in [-0.75, 0.75] (sphere units).
  function sampleWord(word, step) {
    var c = document.createElement('canvas'), w = 1200, h = 420; c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 330px AmeSans, "Helvetica Neue", Arial, sans-serif';
    g.letterSpacing = '-12px';
    g.fillText(word, w / 2, h / 2 + 12);
    var d = g.getImageData(0, 0, w, h).data, pts = [], minX = w, maxX = 0, minY = h, maxY = 0;
    for (var y = 0; y < h; y += step) for (var x = 0; x < w; x += step) {
      if (d[(y * w + x) * 4 + 3] > 140) { pts.push([x, y]); if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    var k = 1.5 / Math.max(1, maxX - minX), cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    var jit = step * k;
    return pts.map(function (p) { return [(p[0] - cx) * k + (Math.random() - 0.5) * jit * 1.6, (p[1] - cy) * k + (Math.random() - 0.5) * jit * 1.6]; });
  }

  function Orb(box) {
    var cv = box.querySelector('canvas'), ctx = cv.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var small = window.innerWidth < 700;
    var ink = [43, 45, 51];
    function readColors() { ink = rgb(css('--site-ink', '#2b2d33'), ink); }
    readColors();
    new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    var words = sampleWord(box.getAttribute('data-word') || 'kiki', small ? 7 : 5);
    var NS = small ? 5600 : 12000, NT = words.length, N = NS + NT;
    var ux = new Float32Array(N), uy = new Float32Array(N), uz = new Float32Array(N);
    var rad = new Float32Array(N), sz = new Float32Array(N), kind = new Uint8Array(N), ph = new Float32Array(N);
    var ox = new Float32Array(N), oy = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
    var sx0 = new Float32Array(NT), sy0 = new Float32Array(NT), sz0 = new Float32Array(NT);   // scattered dust position
    var wx0 = new Float32Array(NT), wy0 = new Float32Array(NT), wz0 = new Float32Array(NT);   // position inside the word
    var delay = new Float32Array(NT);

    for (var i = 0; i < NS; i++) {                       // the sphere shell
      var yy = Math.random() * 2 - 1, r = Math.sqrt(1 - yy * yy), th = Math.random() * TAU;
      ux[i] = Math.cos(th) * r; uy[i] = yy; uz[i] = Math.sin(th) * r;
      var halo = Math.random() < 0.07;
      rad[i] = halo ? 1.04 + Math.random() * 0.34 : 0.985 + Math.random() * 0.03;
      sz[i] = halo ? 0.5 + Math.random() * 0.5 : 0.55 + Math.random() * 0.75;
      kind[i] = 0; ph[i] = Math.random() * TAU;
    }
    var tilt = -0.42, ct = Math.cos(tilt), st = Math.sin(tilt);
    for (var j = 0; j < NT; j++) {                       // dust band inside the sphere -> assembles into the word
      var q = NS + j, ang = Math.random() * TAU, rr = 0.95 * Math.pow(Math.random(), 0.55);
      var bx = Math.cos(ang) * rr, bz = Math.sin(ang) * rr, by = gauss() * 0.11;
      sx0[j] = bx; sy0[j] = by * ct - bz * st; sz0[j] = by * st + bz * ct;
      wx0[j] = words[j][0]; wy0[j] = words[j][1]; wz0[j] = gauss() * 0.02;
      delay[j] = Math.random() * 0.45;
      rad[q] = 1; sz[q] = 0.8 + Math.random() * 0.7; kind[q] = 2; ph[q] = Math.random() * TAU;
    }

    var W = 0, H = 0, R = 0, dpr = 1;
    var yaw = 2.1, pitch = -0.1, yawV = 0, pitchV = 0;         // the word faces you at yaw 0, pitch 0
    var offY = 0, offP = 0;                                     // tiny cursor parallax (does not count for alignment)
    var mx = 0, my = 0, hover = false, tx = 0, ty = 0;
    var down = false, lastX = 0, lastY = 0, touched = false;
    var squeeze = 0, squeezeV = 0, intro = 0, al = 0, locked = false;
    var running = false, visible = true, lastT = 0, clock = 0;

    function resize() {
      var r = box.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(W, H) * 0.44;
      if (!running) frame(performance.now(), true);
    }
    new ResizeObserver(resize).observe(box);

    function local(e) { var r = box.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    box.addEventListener('pointermove', function (e) {
      var p = local(e); mx = p[0]; my = p[1]; hover = true;
      tx = (mx / W - 0.5) * 2; ty = (my / H - 0.5) * 2;
      if (down) {
        var dx = p[0] - lastX, dy = p[1] - lastY, k = 0.0065;
        yawV = dx * k; pitchV = -dy * k;                         // the sphere follows the pointer
        yaw += yawV; pitch += pitchV; lastX = p[0]; lastY = p[1];
      }
    });
    box.addEventListener('pointerleave', function () { hover = false; tx = ty = 0; });
    box.addEventListener('pointerdown', function (e) {
      down = true; touched = true; var p = local(e); lastX = p[0]; lastY = p[1]; yawV = pitchV = 0;
      box.classList.add('is-dragging'); squeezeV -= 0.9;
      try { box.setPointerCapture(e.pointerId); } catch (_) {}
    });
    function up() { if (!down) return; down = false; box.classList.remove('is-dragging'); squeezeV += 0.5; }
    box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);

    function frame(now, still) {
      var dt = Math.min(0.05, (now - lastT) / 1000 || 0.016); lastT = now; clock += dt;
      if (!still) {
        intro = Math.min(1, intro + dt / 1.6);
        if (!touched) {                                          // before the first touch: gentle sway, word stays hidden
          if (!reduce) { yaw = 2.1 + 0.28 * Math.sin(clock * 0.55); pitch = -0.1 + 0.08 * Math.sin(clock * 0.4 + 1); }
        } else if (!down) {                                      // after release: inertia fades out (no endless spinning)
          yaw += yawV * dt * 60; pitch += pitchV * dt * 60;
          var damp = Math.pow(0.04, dt); yawV *= damp; pitchV *= damp;
        }
        pitch = Math.max(-1.45, Math.min(1.45, pitch));
        // alignment with the word's "front" orientation
        var wy = wrap(yaw), dist = Math.hypot(wy, pitch);
        al += (1 - smooth(0.05, 1.05, dist) - al) * Math.min(1, dt * 6);
        if (touched && !down && dist < 0.3) {                    // magnetic snap
          var pull = Math.min(1, dt * 4.5);
          yaw -= wy * pull; pitch -= pitch * pull; yawV *= 0.9; pitchV *= 0.9;
        }
        var nowLocked = dist < 0.05;
        if (nowLocked !== locked) { locked = nowLocked; box.classList.toggle('is-locked', locked); box.dispatchEvent(new CustomEvent('orb:lock', { detail: locked })); }
        offY += ((hover ? tx * 0.1 : 0) - offY) * Math.min(1, dt * 3);
        offP += ((hover ? ty * 0.08 : 0) - offP) * Math.min(1, dt * 3);
        squeezeV += (-squeeze * 60 - squeezeV * 9) * dt; squeeze += squeezeV * dt;
      }
      var yw = yaw + offY, pt = pitch + offP;
      var cy = Math.cos(yw), sy = Math.sin(yw), cp = Math.cos(pt), sp = Math.sin(pt);
      var e = 1 - Math.pow(1 - intro, 3);
      var scale = R * (1 + squeeze * 0.35);
      var cx = W / 2, cyc = H / 2, push = R * 0.32, push2 = push * push;
      var t = clock, shellDim = 1 - 0.55 * smooth(0.55, 1, al);
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < N; i++) {
        var px = ux[i], py = uy[i], pz = uz[i], pw = 0;
        if (kind[i] === 2) {                                    // dust -> word, each particle on its own schedule
          var jj = i - NS; pw = smooth(delay[jj], delay[jj] + 0.55, al);
          var dr = (1 - pw) * 0.035 * Math.sin(clock * 0.8 + ph[i]);
          px = sx0[jj] + (wx0[jj] - sx0[jj]) * pw + dr; py = sy0[jj] + (wy0[jj] - sy0[jj]) * pw + dr * 0.7; pz = sz0[jj] + (wz0[jj] - sz0[jj]) * pw;
        }
        var x = px * cy + pz * sy, z0 = -px * sy + pz * cy;
        var y = py * cp - z0 * sp, z = py * sp + z0 * cp;
        var r = rad[i] * (0.35 + 0.65 * e) + (1 - e) * 0.9 * (ph[i] / TAU);
        var persp = 1 / (1 - z * 0.22);
        var sx = cx + x * scale * r * persp + ox[i], sy2 = cyc + y * scale * r * persp + oy[i];
        if (!still) {
          if (hover) {
            var dx = sx - mx, dy = sy2 - my, d2 = dx * dx + dy * dy;
            if (d2 < push2 && d2 > 0.01) { var d = Math.sqrt(d2), f = 1 - d / push; f *= f; vx[i] += (dx / d) * f * 900 * dt; vy[i] += (dy / d) * f * 900 * dt; }
          }
          vx[i] += (-ox[i] * 38 - vx[i] * 7) * dt; vy[i] += (-oy[i] * 38 - vy[i] * 7) * dt;
          ox[i] += vx[i] * dt; oy[i] += vy[i] * dt;
        }
        var depth = (z + 1) / 2, a, s, c;
        if (kind[i] === 2) {                                    // word particles: dim cloud until aligned
          a = (0.62 + 0.3 * pw + depth * 0.2) * (0.5 + 0.5 * e); s = sz[i] * (0.95 + 0.45 * pw) * (0.85 + depth * 0.4); c = ink;
        } else {
          var rim = 1 - Math.abs(z), near = 0;
          a = (0.06 + depth * 0.62 + rim * 0.34) * (0.55 + 0.45 * e) * shellDim;
          if (hover) { var ddx = sx - mx, ddy = sy2 - my; near = Math.max(0, 1 - Math.sqrt(ddx * ddx + ddy * ddy) / (R * 0.55)); a += near * 0.35; }
          a *= 0.85 + 0.15 * Math.sin(t * 1.4 + ph[i]);
          s = sz[i] * (0.7 + depth * 0.7 + near * 0.6); c = ink;
        }
        if (a <= 0.02) continue;
        ctx.globalAlpha = a > 1 ? 1 : a;
        ctx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
        ctx.fillRect(sx - s / 2, sy2 - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    }
    function loop(now) { if (!running) return; frame(now); requestAnimationFrame(loop); }
    function start() { if (running || reduce) return; running = true; lastT = performance.now(); requestAnimationFrame(loop); }
    function stop() { running = false; }
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible && !document.hidden ? start() : stop(); }).observe(box);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : (visible && start()); });
    resize();
    if (reduce) { intro = 1; yaw = 0; pitch = 0; al = 1; frame(performance.now(), true); }
    box.__orb = { get yaw() { return yaw; }, get pitch() { return pitch; }, get locked() { return locked; }, set: function (a, b) { yaw = a; pitch = b; yawV = pitchV = 0; touched = true; } };
  }

  function init() { document.querySelectorAll('[data-orb]').forEach(Orb); }
  var ready = document.fonts && document.fonts.load ? Promise.race([document.fonts.load('700 100px AmeSans'), new Promise(function (r) { setTimeout(r, 900); })]) : Promise.resolve();
  ready.then(init, init);
})();
