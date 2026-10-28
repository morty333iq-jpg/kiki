/* Word-search motion adapted from the supplied reference: 4420ms groups,
   1020ms outline drawing, 520ms staggered letter emphasis and 350ms fade.
   The grid is decorative; the format list is separately accessible. */
(() => {
  "use strict";
  const root = document.getElementById("design-formats");
  if (!root) return;
  const board = root.querySelector(".wf-board"),
    letters = root.querySelector(".wf-letters"),
    highlights = root.querySelector(".wf-highlights");
  const copy = {
    ru: {
      title: "Дизайн в разных форматах",
      intro:
        "Постеры, обложки, баннеры и сайты.\nРазные форматы — одно внимание к деталям.",
      words: [
        "САЙТЫ",
        "ПОСТЕРЫ",
        "ОБЛОЖКИ",
        "РЕКЛАМА",
        "БАННЕРЫ",
        "АФИШИ",
        "АВАТАРЫ",
        "ПРЕВЬЮ",
        "СОЦСЕТИ",
      ],
      alphabet: "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ",
      accessible:
        "Форматы: сайты, постеры, обложки, реклама, баннеры, афиши, аватары, превью и оформление соцсетей.",
    },
    en: {
      title: "Design in every format",
      intro:
        "Posters, covers, banners, and websites.\nDifferent formats. One attention to detail.",
      words: [
        "WEBSITES",
        "POSTERS",
        "COVERS",
        "ADS",
        "BANNERS",
        "FLYERS",
        "AVATARS",
        "THUMBNAILS",
        "SOCIALMEDIA",
      ],
      alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      accessible:
        "Formats: websites, posters, covers, ads, banners, flyers, avatars, thumbnails, and social media visuals.",
    },
  };
  const placements = [
    { row: 0, col: 8 },
    { row: 1, col: 1 },
    { row: 2, col: 6 },
    { row: 3, col: 3 },
    { row: 4, col: 0 },
    { row: 6, col: 4 },
    { row: 7, col: 1 },
    { row: 8, col: 5 },
    { row: 9, col: 3 },
  ];
  const groups = [
      [1, 4, 7],
      [0, 3, 6],
      [2, 5, 8],
    ],
    reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let cells = [],
    rings = [],
    wordCells = [],
    group = 0,
    visible = false,
    elapsed = 0,
    last = 0,
    raf = 0,
    fadeTimer = 0;
  function ringPath(width) {
    const h = 40,
      x = 2,
      y = 1,
      r = 10,
      right = width - 2,
      bottom = h - 1;
    return `M ${x + r} ${y} H ${right - r} V ${y + 3} H ${right - r + 5} V ${y + 6} H ${right - 2} V ${y + r} H ${right} V ${bottom - r} H ${right - 2} V ${bottom - 6} H ${right - r + 5} V ${bottom - 3} H ${right - r} V ${bottom} H ${x + r} V ${bottom - 3} H ${x + 5} V ${bottom - 6} H ${x + 2} V ${bottom - r} H ${x} V ${y + r} H ${x + 2} V ${y + 6} H ${x + 5} V ${y + 3} H ${x + r} Z`;
  }
  function setGroup(n, animate = true) {
    clearTimeout(fadeTimer);
    rings.forEach((el) => {
      el.classList.remove("is-old");
    });
    cells.forEach((el) => el.classList.remove("is-old"));
    const previous = groups[group];
    if (animate && !reduced.matches) {
      previous.forEach((i) => {
        rings[i].classList.add("is-old");
        wordCells[i].forEach((el) => el.classList.add("is-old"));
      });
    }
    rings.forEach((el) => el.classList.remove("is-active"));
    cells.forEach((el) => el.classList.remove("is-active"));
    group = n;
    groups[group].forEach((i) => {
      rings[i].classList.add("is-active");
      wordCells[i].forEach((el) => el.classList.add("is-active"));
    });
    fadeTimer = setTimeout(() => {
      rings.forEach((el) => el.classList.remove("is-old"));
      cells.forEach((el) => el.classList.remove("is-old"));
    }, 600);
  }
  function render() {
    const t = copy[document.documentElement.lang === "ru" ? "ru" : "en"];
    root.querySelector('[data-wf="title"]').textContent = t.title;
    const intro = root.querySelector('[data-wf="intro"]');
    intro.replaceChildren();
    t.intro.split("\n").forEach((line, i) => {
      if (i) intro.append(document.createElement("br"));
      intro.append(document.createTextNode(line));
    });
    root.querySelector('[data-wf="accessible"]').textContent = t.accessible;
    let seed = 1703;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const chars = Array.from(
      { length: 200 },
      () => t.alphabet[Math.floor(rand() * t.alphabet.length)],
    );
    t.words.forEach((word, i) => {
      [...word].forEach((letter, j) => {
        chars[placements[i].row * 20 + placements[i].col + j] = letter;
      });
    });
    letters.replaceChildren();
    highlights.replaceChildren();
    cells = chars.map((char) => {
      const el = document.createElement("span");
      el.className = "wf-letter";
      el.textContent = char;
      letters.append(el);
      return el;
    });
    wordCells = t.words.map((word, i) =>
      [...word].map((_, j) => {
        const el = cells[placements[i].row * 20 + placements[i].col + j];
        el.style.setProperty("--wf-delay", j * 45 + "ms");
        return el;
      }),
    );
    rings = t.words.map((word, i) => {
      const { row, col } = placements[i],
        el = document.createElement("div");
      el.className = "wf-ring";
      el.dataset.word = word;
      el.style.left = col * 5 + "%";
      el.style.top = row * 10 + "%";
      el.style.width = word.length * 5 + "%";
      el.style.height = "10%";
      const width = word.length * 40;
      el.innerHTML = `<svg viewBox="0 0 ${width} 40" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="${ringPath(width)}" /></svg>`;
      highlights.append(el);
      return el;
    });
    board.classList.toggle(
      "is-static",
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    elapsed = 0;
    setGroup(0, false);
  }
  function tick(now) {
    raf = 0;
    const dt = last ? Math.min(now - last, 100) : 0;
    last = now;
    const quiet = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (quiet && !board.classList.contains("is-static")) render();
    if (visible && !document.hidden && !quiet) {
      elapsed += dt;
      if (elapsed >= 4420) {
        elapsed -= 4420;
        setGroup((group + 1) % groups.length);
      }
    }
    board.classList.toggle("is-paused", !visible || document.hidden);
    if (visible && !document.hidden && !quiet)
      raf = requestAnimationFrame(tick);
  }
  function start() {
    if (raf || !visible || document.hidden || reduced.matches) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  }
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
        board.classList.add("is-paused");
      } else start();
    },
    { threshold: 0.25 },
  ).observe(root);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      board.classList.add("is-paused");
    } else start();
  });
  document.addEventListener("kiki:language", () => {
    render();
    start();
  });
  reduced.addEventListener("change", () => {
    cancelAnimationFrame(raf);
    raf = 0;
    render();
    start();
  });
  render();
})();
