// Game Boy-ish sound: pulse channels (12.5/25/50% duty), triangle "wave" channel, noise.
window.Sound = (function () {
  'use strict';

  let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  const waves = {};
  let muted = false;
  try { muted = localStorage.getItem('gb.muted') === '1'; } catch (e) { /* storage unavailable */ }

  const VOLUME = 0.5;

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.connect(master);
    musicBus = newMusicBus();

    for (const [name, duty] of [['p12', 0.125], ['p25', 0.25], ['p50', 0.5]]) waves[name] = pulseWave(duty);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function newMusicBus() {
    const g = ctx.createGain();
    g.gain.value = 0.6;
    g.connect(master);
    return g;
  }

  function pulseWave(duty) {
    const n = 48, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return ctx.createPeriodicWave(re, im);
  }

  function tone(freq, dur, o = {}) {
    if (!ctx) return;
    const t0 = o.at != null ? o.at : ctx.currentTime + (o.delay || 0);
    dur = Math.max(0.03, dur);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const w = o.wave || 'p50';
    if (waves[w]) osc.setPeriodicWave(waves[w]); else osc.type = w;
    osc.frequency.setValueAtTime(freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    const v = o.vol != null ? o.vol : 0.18;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.004);
    if (o.decay) {
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    } else {
      g.gain.setValueAtTime(v, t0 + dur - 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    }
    osc.connect(g).connect(o.out || sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, o = {}) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (o.delay || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(o.freq || 3000, t0);
    if (o.toFreq) f.frequency.exponentialRampToValueAtTime(o.toFreq, t0 + dur);
    const g = ctx.createGain();
    const v = o.vol != null ? o.vol : 0.25;
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(sfxBus);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + dur + 0.02);
  }

  const notes = (list, o) => list.forEach(([f, d, delay]) => tone(f, d, Object.assign({}, o, { delay })));

  const SFX = {
    boot() {
      tone(1048.6, 0.07, { wave: 'p50', vol: 0.2 });
      tone(2097.2, 1.1, { wave: 'p50', vol: 0.2, delay: 0.075, decay: true });
    },
    cursor() { tone(1318, 0.04, { wave: 'p50', vol: 0.12 }); },
    confirm() { notes([[1046, 0.05, 0], [1568, 0.1, 0.05]], { wave: 'p50', vol: 0.14 }); },
    pause() { notes([[1568, 0.05, 0], [2093, 0.05, 0.08], [1568, 0.05, 0.16], [2093, 0.08, 0.24]], { wave: 'p50', vol: 0.12 }); },
    move() { tone(880, 0.03, { wave: 'p12', vol: 0.1 }); },
    rotate() { tone(1174, 0.035, { wave: 'p25', vol: 0.12, to: 1400 }); },
    lock() { noise(0.08, { vol: 0.28, freq: 1400, toFreq: 300 }); },
    line() { tone(520, 0.3, { wave: 'p50', vol: 0.14, to: 1400 }); noise(0.3, { vol: 0.12, freq: 6000, toFreq: 800 }); },
    tetris() { notes([[523, 0.08, 0], [659, 0.08, 0.08], [784, 0.08, 0.16], [1046, 0.3, 0.24]], { wave: 'p25', vol: 0.16 }); },
    levelup() { notes([[784, 0.07, 0], [988, 0.07, 0.07], [1175, 0.07, 0.14], [1568, 0.18, 0.21]], { wave: 'p50', vol: 0.14 }); },
    eat() { tone(660, 0.07, { wave: 'p25', vol: 0.16, to: 1320 }); },
    bounce() { tone(440, 0.04, { wave: 'p50', vol: 0.12 }); },
    brick() { tone(880 + Math.random() * 200, 0.05, { wave: 'p25', vol: 0.13 }); },
    wall() { tone(330, 0.03, { wave: 'p12', vol: 0.1 }); },
    flap() { tone(420, 0.08, { wave: 'p25', vol: 0.12, to: 840 }); },
    point() { notes([[988, 0.06, 0], [1319, 0.14, 0.06]], { wave: 'p50', vol: 0.12 }); },
    hit() { noise(0.25, { vol: 0.35, freq: 2500, toFreq: 200 }); tone(300, 0.2, { wave: 'p50', vol: 0.12, to: 80 }); },
    shoot() { tone(1600, 0.12, { wave: 'p25', vol: 0.1, to: 300 }); },
    explode() { noise(0.3, { vol: 0.3, freq: 1800, toFreq: 150 }); },
    boom() { noise(0.9, { vol: 0.4, freq: 1200, toFreq: 60 }); tone(160, 0.6, { wave: 'triangle', vol: 0.3, to: 40 }); },
    ufo() { tone(700, 0.12, { wave: 'p50', vol: 0.08, to: 900 }); },
    march(i) { tone([98, 87, 78, 73][i % 4], 0.09, { wave: 'triangle', vol: 0.35 }); },
    die() { tone(700, 0.7, { wave: 'p50', vol: 0.15, to: 60 }); noise(0.5, { vol: 0.18, freq: 1500, toFreq: 100, delay: 0.1 }); },
    gameover() {
      notes([[784, 0.12, 0], [740, 0.12, 0.14], [698, 0.12, 0.28], [659, 0.5, 0.42]], { wave: 'p50', vol: 0.14 });
      notes([[392, 0.12, 0], [370, 0.12, 0.14], [349, 0.12, 0.28], [330, 0.5, 0.42]], { wave: 'triangle', vol: 0.25 });
    },
  };

  // ---------------- music ----------------
  const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(n) {
    const m = /^([A-G])(#|b)?(\d)$/.exec(n);
    const midi = 12 * (+m[3] + 1) + NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Korobeiniki (Russian folk song, public domain). Durations in eighth notes.
  const partA = [
    ['E5', 2], ['B4', 1], ['C5', 1], ['D5', 2], ['C5', 1], ['B4', 1],
    ['A4', 2], ['A4', 1], ['C5', 1], ['E5', 2], ['D5', 1], ['C5', 1],
    ['B4', 3], ['C5', 1], ['D5', 2], ['E5', 2],
    ['C5', 2], ['A4', 2], ['A4', 4],
    [null, 1], ['D5', 2], ['F5', 1], ['A5', 2], ['G5', 1], ['F5', 1],
    ['E5', 3], ['C5', 1], ['E5', 2], ['D5', 1], ['C5', 1],
    ['B4', 2], ['B4', 1], ['C5', 1], ['D5', 2], ['E5', 2],
    ['C5', 2], ['A4', 2], ['A4', 2], [null, 2],
  ];
  const partB = [
    ['E5', 4], ['C5', 4], ['D5', 4], ['B4', 4],
    ['C5', 4], ['A4', 4], ['G#4', 4], ['B4', 4],
    ['E5', 4], ['C5', 4], ['D5', 4], ['B4', 4],
    ['C5', 2], ['E5', 2], ['A5', 4], ['G#5', 8],
  ];
  const bassBar = root => { const r = []; for (let i = 0; i < 8; i++) r.push([root + (i % 2 ? '3' : '2'), 1]); return r; };
  const bass = roots => roots.flatMap(bassBar);
  const aRoots = ['E', 'A', 'G#', 'A', 'D', 'C', 'G#', 'A'];
  const bRoots = ['A', 'G#', 'A', 'G#', 'A', 'G#', 'A', 'G#'];

  const SONGS = {
    korobeiniki: {
      step: 0.19,
      tracks: [
        { wave: 'p25', vol: 0.085, notes: [...partA, ...partA, ...partB] },
        { wave: 'triangle', vol: 0.2, notes: bass([...aRoots, ...aRoots, ...bRoots]).map(([n, d]) => [n.replace(/(\d)$/, (_, o) => String(+o + 1)), d]) },
      ],
    },
  };

  let musicTimer = null, musicState = null;

  function musicStart(name) {
    if (!ctx) return;
    musicStop();
    const song = SONGS[name];
    const start = ctx.currentTime + 0.1;
    musicState = song.tracks.map(tr => ({ tr, i: 0, time: start }));
    const schedule = () => {
      const horizon = ctx.currentTime + 0.3;
      for (const s of musicState) {
        while (s.time < horizon) {
          const [n, len] = s.tr.notes[s.i];
          const dur = len * song.step;
          if (n) tone(freq(n), dur * 0.9, { wave: s.tr.wave, vol: s.tr.vol, at: s.time, out: musicBus });
          s.time += dur;
          s.i = (s.i + 1) % s.tr.notes.length;
        }
      }
    };
    schedule();
    musicTimer = setInterval(schedule, 50);
  }

  function musicStop() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    musicState = null;
    if (!ctx) return;
    // Fade out notes that are already scheduled, route new ones to a fresh bus.
    const old = musicBus;
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
    setTimeout(() => old.disconnect(), 400);
    musicBus = newMusicBus();
  }

  function setMuted(m) {
    muted = m;
    try { localStorage.setItem('gb.muted', m ? '1' : '0'); } catch (e) { /* storage unavailable */ }
    if (master) master.gain.setTargetAtTime(m ? 0 : VOLUME, ctx.currentTime, 0.02);
  }

  return {
    init,
    play(name, arg) { if (ctx && SFX[name]) SFX[name](arg); },
    music: { start: musicStart, stop: musicStop, get playing() { return !!musicTimer; } },
    stopAll() { musicStop(); },
    get muted() { return muted; },
    setMuted,
    toggleMute() { setMuted(!muted); return muted; },
  };
})();
