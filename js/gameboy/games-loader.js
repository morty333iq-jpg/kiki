// Loads remote games in parallel, then boots the console (main.js).
(function () {
  'use strict';
  // Load games in parallel, but never make the page wait indefinitely.
  const gameSources = ['tetris.js', 'snake.js', 'breakout.js', 'flappy.js', 'invaders.js'];
  const gameLoads = gameSources.map(
    (file) =>
      new Promise((resolve) => {
        const script = document.createElement('script');
        let finished = false;
        const finish = () => {
          if (!finished) {
            finished = true;
            resolve();
          }
        };
        script.src = 'https://f7707111-rgb.github.io/OS/js/games/' + file;
        script.async = false;
        script.onload = finish;
        script.onerror = finish;
        document.head.appendChild(script);
        setTimeout(finish, 1800);
      }),
  );
  Promise.all(gameLoads).then(() => {
    const mainScript = document.createElement('script');
    mainScript.src = 'js/gameboy/main.js';
    document.body.appendChild(mainScript);
  });
})();
