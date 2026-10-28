// Language switch (EN/RU), saved in localStorage. The site uses a fixed light theme.
(function () {
  'use strict';
  const translations = window.KIKI_TRANSLATIONS;

  const langButton = document.getElementById('lang-toggle');
  function setLanguage(lang) {
    const t = translations[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const value = t[el.dataset.i18n];
      if (value !== undefined) el.innerHTML = value;
    });
    document.dispatchEvent(new CustomEvent('kiki:language', { detail: lang }));
    try {
      localStorage.setItem('kiki-language', lang);
    } catch (e) {}
    if (!langButton) return;
    langButton.textContent = lang === 'en' ? 'RU' : 'EN';
    langButton.setAttribute('aria-label', lang === 'en' ? 'Switch to Russian' : 'Switch to English');
  }
  if (langButton)
    langButton.addEventListener('click', () => setLanguage(document.documentElement.lang === 'en' ? 'ru' : 'en'));
  let initialLanguage = 'en';
  try {
    initialLanguage = localStorage.getItem('kiki-language') === 'ru' ? 'ru' : 'en';
  } catch (e) {}
  setLanguage(initialLanguage);
})();
