// ASADO Express Paphos — i18n runtime
// 7 locales. Swaps text on [data-i18n] attributes, flips dir+lang for HE/AR.
// Persists choice in URL (?lang=) + localStorage. Zero dependencies.

(function () {
  'use strict';

  const LANGS = ['en', 'he', 'ar', 'el', 'ru', 'fr', 'it'];
  const RTL = new Set(['he', 'ar']);
  const STORAGE_KEY = 'asado.lang';
  const FALLBACK = 'en';

  let dict = null;

  function detect() {
    const url = new URL(window.location.href);
    const fromUrl = (url.searchParams.get('lang') || '').toLowerCase();
    if (LANGS.includes(fromUrl)) return fromUrl;

    const fromStore = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(fromStore)) return fromStore;

    const browser = (navigator.language || '').slice(0, 2).toLowerCase();
    if (LANGS.includes(browser)) return browser;

    return FALLBACK;
  }

  function applyAttrText(el, value) {
    // <meta>, <html title> needs `content`; everything else is textContent
    if (el.tagName === 'META') {
      el.setAttribute('content', value);
    } else if (el.tagName === 'TITLE') {
      el.textContent = value;
      document.title = value;
    } else if (el.hasAttribute('aria-label')) {
      el.setAttribute('aria-label', value);
      el.textContent = value;
    } else {
      el.textContent = value;
    }
  }

  function apply(lang) {
    if (!dict || !dict[lang]) return;
    const strings = dict[lang];
    const html = document.documentElement;

    html.setAttribute('lang', lang);
    html.setAttribute('dir', RTL.has(lang) ? 'rtl' : 'ltr');

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const value = strings[key];
      if (typeof value === 'string') applyAttrText(el, value);
    });

    // Update language switcher state
    const current = document.getElementById('lang-current');
    if (current) {
      const codes = { en: 'EN', he: 'עב', ar: 'ع', el: 'ΕΛ', ru: 'RU', fr: 'FR', it: 'IT' };
      current.textContent = codes[lang] || lang.toUpperCase();
    }
    document.querySelectorAll('#lang-menu li').forEach((li) => {
      li.setAttribute('aria-selected', li.getAttribute('data-lang') === lang ? 'true' : 'false');
    });

    // Persist
    localStorage.setItem(STORAGE_KEY, lang);
    const url = new URL(window.location.href);
    if (url.searchParams.get('lang') !== lang) {
      url.searchParams.set('lang', lang);
      history.replaceState(null, '', url.toString());
    }
  }

  function wireSwitcher() {
    const root = document.querySelector('[data-lang-switch]');
    if (!root) return;
    const btn = root.querySelector('.lang-btn');
    const menu = root.querySelector('#lang-menu');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = root.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    menu.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-lang]');
      if (!li) return;
      apply(li.getAttribute('data-lang'));
      root.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('click', (e) => {
      if (!root.contains(e.target)) {
        root.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        root.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  async function init() {
    try {
      const res = await fetch('i18n.json', { cache: 'force-cache' });
      dict = await res.json();
    } catch (err) {
      console.error('i18n.json load failed:', err);
      return;
    }
    wireSwitcher();
    apply(detect());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
