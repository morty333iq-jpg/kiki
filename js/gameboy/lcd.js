// 160x144 four-shade LCD: framebuffer of palette indices + dot-matrix presenter.
(function () {
  'use strict';

  const W = 160, H = 144;
  // 0 = lightest … 3 = darkest (yellow-green DMG screen, as on the photo)
  const PALETTE = ['#c5ce4b', '#8ea83c', '#4d6d33', '#22391f'];
  const OFF_COLOR = '#a2aa55';
  const GHOSTING = 0.72; // share of the new frame drawn over the previous one

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const makeCanvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };

  class LCD {
    constructor(canvas) {
      this.W = W; this.H = H;
      this.fb = new Uint8Array(W * H);
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.rgb = PALETTE.map(hex);

      this.small = makeCanvas(W, H);
      this.sctx = this.small.getContext('2d');
      this.img = this.sctx.createImageData(W, H);
      this.mid = makeCanvas(W * 2, H * 2);
      this.mctx = this.mid.getContext('2d');
      this.grid = null;
      this.fresh = true;

      this.resize();
      if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(canvas);
      else window.addEventListener('resize', () => this.resize());
    }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = Math.max(W, Math.round(r.width * dpr));
      const h = Math.max(H, Math.round(r.height * dpr));
      if (w === this.canvas.width && h === this.canvas.height && this.grid) return;
      this.canvas.width = w;
      this.canvas.height = h;

      // Upscale with nearest-neighbour to an integer multiple, then smooth-downscale:
      // keeps every LCD dot the same size at any zoom.
      const k = Math.max(2, Math.ceil(w / W));
      this.mid.width = W * k;
      this.mid.height = H * k;

      this.grid = makeCanvas(W * k, H * k);
      const g = this.grid.getContext('2d');
      const [r0, g0, b0] = this.rgb[0];
      g.fillStyle = `rgba(${r0},${g0},${b0},0.38)`;
      const lw = Math.max(1, Math.round(k * 0.14));
      for (let x = 1; x < W; x++) g.fillRect(x * k - lw, 0, lw, H * k);
      for (let y = 1; y < H; y++) g.fillRect(0, y * k - lw, W * k, lw);
      this.fresh = true;
    }

    // ---------- drawing into the framebuffer ----------
    clear(c = 0) { this.fb.fill(c); }

    px(x, y, c) {
      x = Math.round(x); y = Math.round(y);
      if (x >= 0 && x < W && y >= 0 && y < H) this.fb[y * W + x] = c;
    }

    get(x, y) {
      return (x >= 0 && x < W && y >= 0 && y < H) ? this.fb[y * W + x] : 0;
    }

    rect(x, y, w, h, c) {
      x = Math.round(x); y = Math.round(y);
      const x0 = Math.max(0, x), y0 = Math.max(0, y);
      const x1 = Math.min(W, x + w), y1 = Math.min(H, y + h);
      if (x1 <= x0) return;
      for (let yy = y0; yy < y1; yy++) this.fb.fill(c, yy * W + x0, yy * W + x1);
    }

    frame(x, y, w, h, c) {
      this.rect(x, y, w, 1, c);
      this.rect(x, y + h - 1, w, 1, c);
      this.rect(x, y, 1, h, c);
      this.rect(x + w - 1, y, 1, h, c);
    }

    // Game Boy style window: dark / light / dark double border.
    box(x, y, w, h) {
      this.rect(x, y, w, h, 3);
      this.rect(x + 1, y + 1, w - 2, h - 2, 0);
      this.frame(x + 2, y + 2, w - 4, h - 4, 3);
    }

    checker(x, y, w, h, a, b) {
      for (let yy = y; yy < y + h; yy++)
        for (let xx = x; xx < x + w; xx++) this.px(xx, yy, ((xx + yy) & 1) ? a : b);
    }

    text(str, x, y, c = 3, s = 1) {
      str = String(str);
      const G = window.FONT.glyphs;
      let cx = Math.round(x);
      y = Math.round(y);
      for (const ch of str) {
        const g = G[ch] || G[ch.toUpperCase()] || G['?'];
        for (let i = 0; i < g.length; i += 2) {
          if (s === 1) this.px(cx + g[i], y + g[i + 1], c);
          else this.rect(cx + g[i] * s, y + g[i + 1] * s, s, s, c);
        }
        cx += 6 * s;
      }
      return cx - x;
    }

    textWidth(str, s = 1) { return String(str).length * 6 * s - s; }
    textCenter(str, y, c = 3, s = 1) { return this.text(str, Math.round((W - this.textWidth(str, s)) / 2), y, c, s); }
    textIn(str, x, w, y, c = 3, s = 1) { return this.text(str, x + Math.round((w - this.textWidth(str, s)) / 2), y, c, s); }
    textRight(str, right, y, c = 3, s = 1) { return this.text(str, right - this.textWidth(str, s), y, c, s); }

    // Text with a 1px outline so it stays readable over busy backgrounds.
    textOutlined(str, x, y, c = 3, o = 0, s = 1) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]])
        this.text(str, x + dx, y + dy, o, s);
      this.text(str, x, y, c, s);
    }

    sprite(spr, x, y, opts) {
      x = Math.round(x); y = Math.round(y);
      const flip = opts && opts.flipX, map = opts && opts.map;
      const { w, h, px } = spr;
      for (let j = 0; j < h; j++) {
        for (let i = 0; i < w; i++) {
          const v = px[j * w + (flip ? w - 1 - i : i)];
          if (v >= 0) this.px(x + i, y + j, map ? map[v] : v);
        }
      }
    }

    // ---------- output ----------
    present() {
      const d = this.img.data, fb = this.fb, rgb = this.rgb;
      for (let i = 0, j = 0; i < fb.length; i++, j += 4) {
        const c = rgb[fb[i]];
        d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = 255;
      }
      this.sctx.putImageData(this.img, 0, 0);

      const m = this.mctx;
      m.imageSmoothingEnabled = false;
      m.drawImage(this.small, 0, 0, this.mid.width, this.mid.height);
      m.drawImage(this.grid, 0, 0);

      const c = this.ctx;
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = 'high';
      // Slow LCD pixels: blend over the previous frame for the classic ghosting.
      c.globalAlpha = this.fresh ? 1 : GHOSTING;
      c.drawImage(this.mid, 0, 0, this.canvas.width, this.canvas.height);
      c.globalAlpha = 1;
      this.fresh = false;
    }

    presentOff() {
      const c = this.ctx;
      c.globalAlpha = this.fresh ? 1 : 0.25;
      c.fillStyle = OFF_COLOR;
      c.fillRect(0, 0, this.canvas.width, this.canvas.height);
      c.globalAlpha = 1;
      this.fresh = false;
    }

    // ---------- sprite helpers ----------
    // rows of '0'..'3' (shade) and '.' (transparent)
    static sprite(rows) {
      const h = rows.length, w = Math.max(...rows.map(r => r.length));
      const px = new Int8Array(w * h).fill(-1);
      rows.forEach((r, y) => {
        for (let x = 0; x < r.length; x++) {
          const ch = r[x];
          if (ch >= '0' && ch <= '3') px[y * w + x] = ch.charCodeAt(0) - 48;
        }
      });
      return { w, h, px };
    }

    // rotate 90° clockwise
    static rotate(spr) {
      const { w, h, px } = spr;
      const out = new Int8Array(w * h);
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) out[x * h + (h - 1 - y)] = px[y * w + x];
      return { w: h, h: w, px: out };
    }
  }

  LCD.PALETTE = PALETTE;
  window.LCD = LCD;
})();
