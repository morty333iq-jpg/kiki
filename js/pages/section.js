// section.html — chapter page in a book layout: sidebar with all chapters and their parts,
// content column on the right. Data comes from js/data/sections.js (?s=slug).
(function () {
  'use strict';
  const sections = window.KIKI_SECTIONS || [];
  const t = window.KIKI_TRANSLATIONS || {};
  const slug = new URLSearchParams(location.search).get('s');
  const index = Math.max(
    0,
    sections.findIndex((item) => item.slug === slug),
  );
  const item = sections[index];
  const $ = (name) => document.querySelector('[data-section="' + name + '"]');
  const nav = document.querySelector('[data-chapter-nav]');
  const side = document.querySelector('.chapter-side-inner');
  const roman = (n) => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n + 1);
  const strip = (html) => html.replace(/<[^>]+>/g, '').trim();
  let firstRender = true;

  // Part titles of a chapter = its <h2> headings (without the "01" number).
  function parts(body) {
    return [...body.matchAll(/<h2>(?:<span>.*?<\/span>)?(.*?)<\/h2>/g)].map((m) => strip(m[1]));
  }

  function renderNav(lang) {
    const tr = t[lang] || t.en;
    nav.innerHTML = sections
      .map((s, i) => {
        const c = s[lang] || s.en;
        const here = i === index;
        const base = here ? '' : 'section.html?s=' + s.slug;
        const links = [
          `<li><a href="${base}#intro" data-part="intro"${here ? '' : ' data-page-link'}>${tr.sectionIntro}</a></li>`,
        ]
          .concat(
            parts(c.body).map(
              (p, k) =>
                `<li><a href="${base}#part-${k + 1}" data-part="part-${k + 1}"${here ? '' : ' data-page-link'}>${p}</a></li>`,
            ),
          )
          .join('');
        return `<div class="chapter-group${here ? ' is-current' : ''}">
          <a class="chapter-group-head" href="section.html?s=${s.slug}"${here ? ' aria-current="page"' : ' data-page-link'}>
            <span class="chapter-roman">(${roman(i)})</span><span>${c.card}</span>
          </a>
          <ul>${links}</ul>
        </div>`;
      })
      .join('');
  }

  function renderPager(lang) {
    const tr = t[lang] || t.en;
    const link = (i, label, cls) => {
      const s = sections[i];
      if (!s) return '<span></span>';
      const c = s[lang] || s.en;
      return `<a class="chapter-pager-link ${cls}" href="section.html?s=${s.slug}" data-page-link>
        <small>${label}</small><span>${tr.sectionChapter} ${roman(i)} · ${c.card}</span></a>`;
    };
    $('pager').innerHTML =
      link(index - 1, '← ' + tr.sectionPrev, 'is-prev') + link(index + 1, tr.sectionNext + ' →', 'is-next');
  }

  function render(lang) {
    const c = item[lang] || item.en;
    const tr = t[lang] || t.en;
    document.title = 'kiki — ' + c.title;
    $('kicker').textContent = `${tr.sectionChapter} ${roman(index)}`;
    $('title').textContent = c.title;
    $('lead').textContent = c.lead;
    $('image').src = item.image;
    $('body').innerHTML = c.body;
    $('body')
      .querySelectorAll('h2')
      .forEach((h, k) => ((h.closest('.doc-block') || h).id = 'part-' + (k + 1)));

    // Keep original part IDs and navigation intact; diagrams have h3, not h2.
    const visuals = window.KIKI_CHAPTER_VISUALS ? window.KIKI_CHAPTER_VISUALS(item.slug, lang) : [];
    const blocks = [...$('body').querySelectorAll('.doc-block')];
    visuals.forEach((html, n) => {
      const anchor = blocks[n === 0 ? 0 : Math.max(1, blocks.length - 2)];
      if (anchor) anchor.insertAdjacentHTML('afterend', html);
    });

    const actions = [];
    if (c.link)
      actions.push(`<a class="ref-button" href="${c.link.url}" target="_blank" rel="noopener">${c.link.label} ↗</a>`);
    $('actions').innerHTML = actions.join('');
    $('actions').hidden = !actions.length;

    renderNav(lang);
    renderPager(lang);
    if (firstRender && location.hash) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) requestAnimationFrame(() => target.scrollIntoView());
    }
    firstRender = false;
    spy();
  }

  // Highlight the part that is on screen and keep it visible in the sidebar.
  let active = '';
  function spy() {
    const line = window.innerHeight * 0.3;
    let current = 'intro';
    document.querySelectorAll('.chapter-body [id^="part-"]').forEach((el) => {
      if (el.getBoundingClientRect().top < line) current = el.id;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      const all = document.querySelectorAll('.chapter-body [id^="part-"]');
      if (all.length) current = all[all.length - 1].id;
    }
    const links = nav.querySelectorAll('.is-current [data-part]');
    links.forEach((a) => a.classList.toggle('is-active', a.dataset.part === current));
    if (current === active) return;
    active = current;
    const link = nav.querySelector('.is-current .is-active');
    if (link && side.scrollHeight > side.clientHeight) {
      const top = link.offsetTop - side.clientHeight / 2;
      side.scrollTo({ top, behavior: 'smooth' });
    }
  }

  // Smooth scroll for parts of the current chapter.
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('.is-current [data-part]');
    if (!a) return;
    const target = document.getElementById(a.dataset.part);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', '#' + a.dataset.part);
  });

  // Click a work to see it bigger; click again or press Esc to close.
  document.addEventListener('click', (e) => {
    const img = e.target.closest('.work img');
    if (!img) return;
    const view = document.createElement('div');
    view.className = 'work-view';
    view.innerHTML = `<img src="${img.src}" alt="${img.alt}">`;
    const close = () => {
      view.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => view.remove(), 350);
    };
    const onKey = (k) => k.key === 'Escape' && close();
    view.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.append(view);
    requestAnimationFrame(() => requestAnimationFrame(() => view.classList.add('open')));
  });

  window.addEventListener('scroll', spy, { passive: true });
  window.addEventListener('resize', spy);
  document.addEventListener('kiki:language', (e) => render(e.detail));
})();
