(function () {
  'use strict';

  const device = document.getElementById('gameboy');
  const lcd = new LCD(document.getElementById('lcd'));
  const I = window.Input, snd = window.Sound;

  // Keep the console usable even if remote game files are blocked or load slowly.
  const fallbackGames = [{
    id: 'kiki',
    title: 'KIKI',
    icon: ['.3333...', '33..33..', '3.33.3..', '3.33.3..', '33..33..', '.3333...', '..33....'],
    create() {
      let x = 77, y = 76, t = 0;
      return {
        update() {
          t++;
          if (I.down('left')) x -= 1.5;
          if (I.down('right')) x += 1.5;
          if (I.down('up')) y -= 1.5;
          if (I.down('down')) y += 1.5;
          x = Math.max(4, Math.min(150, x));
          y = Math.max(38, Math.min(134, y));
        },
        draw(screen) {
          screen.clear(0);
          screen.textCenter('KIKI', 12, 3);
          screen.textCenter('READY', 24, 2);
          screen.rect(Math.round(x), Math.round(y), 6, 6, 3);
          if (t % 90 < 60) screen.textCenter('USE D-PAD', 138, 2);
        },
      };
    },
  }];
  const games = Array.isArray(window.GB_GAMES) && window.GB_GAMES.length ? window.GB_GAMES : fallbackGames;
  const ICONS = games.map(gm => LCD.sprite(gm.icon));

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
  };
  const hiOf = id => store.get('gb.hi.' + id, 0);
  const pad = (n, l) => String(n).padStart(l, '0');

  const LOGO_STOP = 104, BOOT_END = LOGO_STOP + 80;

  let power = false;
  let mode = 'off'; // off | boot | menu | game
  let t = 0;
  let sel = Math.min(games.length - 1, Math.max(0, store.get('gb.sel', 0)));
  let game = null; // { def, inst, paused, over }

  // ---------------- power ----------------
  function setPower(on) {
    if (on === power) return;
    power = on;
    device.classList.toggle('is-on', on);
    document.body.classList.toggle('power-on', on);
    if (on) {
      snd.init();
      mode = 'boot';
      t = 0;
    } else {
      endGame();
      snd.stopAll();
      I.releaseAll();
      mode = 'off';
    }
  }

  const powerBtn = document.getElementById('power');
  powerBtn.addEventListener('click', () => { setPower(!power); powerBtn.blur(); });

  const muteBtn = document.getElementById('mute');
  const syncMute = () => {
    if (!muteBtn) return;
    muteBtn.textContent = snd.muted ? 'звук выкл' : 'звук вкл';
    muteBtn.setAttribute('aria-pressed', String(!snd.muted));
  };
  if (muteBtn) muteBtn.addEventListener('click', () => { snd.toggleMute(); syncMute(); muteBtn.blur(); });
  syncMute();

  window.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.code === 'KeyP') setPower(!power);
    else if (e.code === 'KeyM') { snd.toggleMute(); syncMute(); }
    else if (!power && e.code === 'Enter') setPower(true);
  });

  document.querySelectorAll('[data-btn]').forEach(el => I.bindButton(el));
  I.bindDpad(document.getElementById('dpad'));

  // Tapping the dark screen turns the console on — friendlier than hunting for the switch.
  document.getElementById('lcd').addEventListener('click', () => { if (!power) setPower(true); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game && !game.paused && !game.over) pause();
  });

  // ---------------- game lifecycle ----------------
  function startGame(i) {
    const def = games[i];
    const g = { def, inst: null, paused: false, over: null };
    game = g;
    g.inst = def.create({
      hi: hiOf(def.id),
      over(score) {
        if (game !== g || g.over) return;
        snd.music.stop();
        const hi = hiOf(def.id);
        const isNew = score > hi;
        if (isNew) store.set('gb.hi.' + def.id, score);
        g.over = { score, hi: Math.max(hi, score), isNew, t: 0 };
        snd.play('gameover');
      },
    });
    mode = 'game';
  }

  function endGame() {
    if (!game) return;
    if (game.inst.destroy) game.inst.destroy();
    snd.music.stop();
    game = null;
  }

  function pause() {
    game.paused = true;
    snd.music.stop();
    snd.play('pause');
  }

  function resume() {
    game.paused = false;
    if (game.inst.resume) game.inst.resume();
  }

  // ---------------- update ----------------
  function update() {
    I.poll();
    t++;

    switch (mode) {
      case 'boot':
        if (t === LOGO_STOP) snd.play('boot');
        if (t >= BOOT_END || (t > 20 && I.any('start', 'a'))) { mode = 'menu'; t = 0; }
        break;

      case 'menu':
        if (I.repeat('up', 20, 8)) { sel = (sel + games.length - 1) % games.length; snd.play('cursor'); }
        if (I.repeat('down', 20, 8)) { sel = (sel + 1) % games.length; snd.play('cursor'); }
        if (I.any('a', 'start')) {
          store.set('gb.sel', sel);
          snd.play('confirm');
          startGame(sel);
        }
        break;

      case 'game': {
        const g = game;
        if (g.over) {
          g.over.t++;
          if (g.over.t > 40) {
            if (I.any('a', 'start')) { endGame(); startGame(sel); }
            else if (I.any('b', 'select')) { endGame(); mode = 'menu'; t = 0; }
          }
        } else if (g.paused) {
          if (I.pressed('start')) resume();
          else if (I.pressed('select')) { endGame(); mode = 'menu'; t = 0; }
        } else if (I.pressed('start')) {
          pause();
        } else {
          g.inst.update();
        }
        break;
      }
    }
  }

  // ---------------- render ----------------
  function drawBoot() {
    lcd.clear(0);
    if (t < 8) return;
    const y = Math.min(62, -10 + (t - 8) * (72 / (LOGO_STOP - 8)));
    const x = Math.round((160 - 49) / 2);
    // bold logo: draw twice with 1px offset
    lcd.text('Nintendo', x, Math.round(y), 3);
    lcd.text('Nintendo', x + 1, Math.round(y), 3);
    if (y >= 62) {
      // ® mark
      lcd.frame(x + 51, 60, 5, 5, 3);
      lcd.px(x + 53, 62, 3);
    }
  }

  function drawMenu() {
    lcd.clear(0);
    lcd.rect(0, 0, 160, 19, 3);
    lcd.textCenter('SELECT GAME', 6, 0);
    lcd.rect(0, 20, 160, 1, 2);

    games.forEach((gm, i) => {
      const y = 28 + i * 16;
      if (i === sel) {
        lcd.rect(8, y - 3, 144, 13, 1);
        if (t % 40 < 28) lcd.text('>', 12, y, 3);
      }
      lcd.sprite(ICONS[i], 26, y);
      lcd.text(gm.title, 40, y, 3);
    });

    lcd.rect(0, 110, 160, 1, 2);
    lcd.textCenter('HI-SCORE ' + pad(hiOf(games[sel].id), 6), 116, 3);
    if (t % 60 < 42) lcd.textCenter('PUSH START', 130, 3);
  }

  function drawPause() {
    lcd.box(24, 44, 112, 52);
    lcd.textCenter('PAUSE', 52, 3);
    lcd.textCenter('START:RESUME', 68, 3);
    lcd.textCenter('SELECT:MENU', 80, 3);
  }

  function drawOver(o) {
    lcd.box(16, 30, 128, 84);
    lcd.textCenter('GAME OVER', 38, 3);
    lcd.text('SCORE', 26, 54, 3);
    lcd.textRight(String(o.score), 134, 54, 3);
    lcd.text('HI', 26, 66, 3);
    lcd.textRight(String(o.hi), 134, 66, 3);
    if (o.isNew && o.t % 30 < 20) lcd.textCenter('NEW RECORD!', 80, 3);
    if (o.t > 40) lcd.textCenter('A:RETRY B:MENU', 98, 3);
  }

  function render() {
    if (!power) { lcd.presentOff(); return; }
    switch (mode) {
      case 'boot': drawBoot(); break;
      case 'menu': drawMenu(); break;
      case 'game':
        game.inst.draw(lcd);
        if (game.over) { if (game.over.t > 20) drawOver(game.over); }
        else if (game.paused) drawPause();
        break;
    }
    lcd.present();
  }

  // ---------------- loop (fixed 60 Hz) ----------------
  const STEP = 1000 / 60;
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(100, now - last);
    last = now;
    while (acc >= STEP) { update(); acc -= STEP; }
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
