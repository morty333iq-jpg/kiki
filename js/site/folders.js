// Folder cards (home page + "more" grid on section.html) and the page-leave fade.
(function () {
  'use strict';
  const sections = window.KIKI_SECTIONS || [];

  function card(item, index, lang) {
    const c = item[lang] || item.en;
    const a = document.createElement('a');
    a.className = 'folder';
    a.href = 'section.html?s=' + item.slug;
    a.dataset.folder = item.slug;
    a.setAttribute('aria-label', c.title);
    a.innerHTML = `
      <span class="folder-book">
        <span class="folder-spine"></span>
        <span class="folder-page">
          <span class="folder-label">kiki / ${String(index + 1).padStart(2, '0')}</span>
          <span class="folder-title">${c.card}</span>
          <span class="folder-rule"></span>
          <img class="folder-art" src="${item.image}" alt="" width="800" height="600" loading="lazy" decoding="async">
          <span class="folder-meta"><span>by kiki</span><span>2026</span></span>
        </span>
      </span>
      <span class="folder-pocket" aria-hidden="true"></span>`;
    return a;
  }

  function render(lang) {
    document.querySelectorAll('[data-folders]').forEach((grid) => {
      const skip = grid.dataset.exclude;
      grid.replaceChildren(
        ...sections.map((item, i) => (item.slug === skip ? null : card(item, i, lang))).filter(Boolean),
      );
    });
  }

  // Smooth fade before moving to another page of the site.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a.folder, a[data-page-link]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    document.documentElement.classList.add('page-leave');
    setTimeout(() => (location.href = link.href), 280);
  });
  window.addEventListener('pageshow', () => document.documentElement.classList.remove('page-leave'));

  document.addEventListener('kiki:language', (e) => render(e.detail));
  render(document.documentElement.lang === 'ru' ? 'ru' : 'en');
})();
