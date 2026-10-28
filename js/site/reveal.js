// Scroll reveal for [data-aos] blocks (AOS-style).
// Scrolling down: blocks slide in. Scrolling up: blocks below the screen hide again,
// so the animation replays next time. Blocks already on screen always show —
// also when the page opens on an anchor like #about-kiki.
(function () {
  'use strict';
  const items = [...document.querySelectorAll('[data-aos]')];
  let lastScrollY = window.scrollY;

  function update() {
    const triggerLine = window.innerHeight * 0.88;
    const scrollingUp = window.scrollY < lastScrollY;
    items.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (scrollingUp && rect.top > triggerLine) {
        if (el.classList.contains('in')) {
          el.classList.remove('in');
          el.classList.add('out-left');
        }
      } else if (rect.top < triggerLine && rect.bottom > 0) {
        el.classList.remove('out-left');
        el.classList.add('in');
      }
    });
    lastScrollY = window.scrollY;
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  update();
})();
