/* ============ Pienipeli: languages ============
   One small system for every page and game.

   - Pages are written in English. Any element can be translated with:
       data-i18n="key"            -> its text
       data-i18n-html="key"       -> its inner HTML (only for our own trusted strings)
       data-i18n-attr="aria-label:key; title:key2"  -> attributes
   - Each language lives in assets/i18n/<code>.js and registers itself with
     PP_I18N.add('<code>', { key: 'text', ... }). Only the chosen language is loaded.
   - The choice is remembered on this device (localStorage "pienipeli-lang") and shared
     by every page and game. First visit: the browser's language if we have it, else English.
   - Any element with [data-lang-picker] becomes a language selector (a native <select>,
     so it works with touch, keyboard and screen readers everywhere).

   Adding a language (for example Turkish): translate assets/i18n/en.js into
   assets/i18n/tr.js with every key, then set `ready: true` for it in LANGS below.  */

(() => {
  'use strict';

  const LANGS = [
    { code: 'en', name: 'English', ready: true },
    { code: 'fi', name: 'Suomi', ready: true },
    { code: 'bn', name: 'বাংলা', ready: true },
    { code: 'tr', name: 'Türkçe', ready: true }
  ];
  const READY = LANGS.filter(l => l.ready).map(l => l.code);
  const KEY = 'pienipeli-lang';

  const here = document.currentScript && document.currentScript.src;
  const DIR = here ? new URL('../i18n/', here).href : null;

  const dicts = {};
  const listeners = [];
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } }
  };

  function detect() {
    const saved = store.get();
    if (saved && READY.includes(saved)) return saved;
    const prefs = (navigator.languages || [navigator.language || 'en']).map(l => String(l).slice(0, 2).toLowerCase());
    return prefs.find(l => READY.includes(l)) || 'en';
  }

  let lang = detect();
  document.documentElement.lang = lang;

  // English text is already in the page; remember it so we can switch back without a reload.
  const originals = new WeakMap();

  function t(key, fallback) {
    const d = dicts[lang];
    if (d && d[key] !== undefined) return d[key];
    if (dicts.en && dicts.en[key] !== undefined) return dicts.en[key];
    return fallback !== undefined ? fallback : key;
  }

  function apply(root = document) {
    const d = dicts[lang] || {};
    const pick = (el, key, orig) => (lang !== 'en' && d[key] !== undefined) ? d[key] : orig;
    root.querySelectorAll('[data-i18n]').forEach(el => {
      if (!originals.has(el)) originals.set(el, { text: el.textContent });
      el.textContent = pick(el, el.dataset.i18n, originals.get(el).text);
    });
    root.querySelectorAll('[data-i18n-html]').forEach(el => {
      if (!originals.has(el)) originals.set(el, { html: el.innerHTML });
      el.innerHTML = pick(el, el.dataset.i18nHtml, originals.get(el).html);
    });
    root.querySelectorAll('[data-i18n-attr]').forEach(el => {
      if (!originals.has(el)) originals.set(el, { attrs: {} });
      const o = originals.get(el);
      if (!o.attrs) o.attrs = {};
      el.dataset.i18nAttr.split(';').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s && s.trim());
        if (!attr || !key) return;
        if (!(attr in o.attrs)) o.attrs[attr] = el.getAttribute(attr) || '';
        el.setAttribute(attr, pick(el, key, o.attrs[attr]));
      });
    });
    // Page title + description
    const tk = document.documentElement.dataset.i18nTitle;
    if (tk) {
      if (!originals.has(document)) originals.set(document, { title: document.title });
      document.title = pick(null, tk, originals.get(document).title);
    }
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
  }

  function load(code) {
    if (dicts[code] || code === 'en' && dicts.en) return Promise.resolve();
    if (!DIR) return Promise.resolve();
    return new Promise(resolve => {
      const s = document.createElement('script');
      s.src = DIR + code + '.js';
      s.onload = resolve;
      s.onerror = resolve;          // missing file: we simply stay with English text
      document.head.appendChild(s);
    });
  }

  async function set(code, save = true) {
    if (!READY.includes(code)) code = 'en';
    await load(code);
    lang = code;
    if (save) store.set(code);
    apply();
    pickers.forEach(sel => { sel.value = code; });
    listeners.forEach(fn => { try { fn(code); } catch (e) { /* a listener failing must not break the page */ } });
  }

  /* ---------- Language selector ---------- */
  const pickers = [];
  function buildPickers() {
    document.querySelectorAll('[data-lang-picker]').forEach(host => {
      if (host.dataset.ready) return;
      host.dataset.ready = '1';
      const id = 'lang-' + Math.random().toString(36).slice(2, 7);
      host.innerHTML =
        `<label class="lang-label" for="${id}"><span class="lang-globe" aria-hidden="true">` +
        `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>` +
        `</span><span class="sr-only" data-i18n="lang.label">Language</span></label>` +
        `<select id="${id}" class="lang-select">${LANGS.filter(l => l.ready).map(l =>
          `<option value="${l.code}" lang="${l.code}">${l.name}</option>`).join('')}</select>`;
      const sel = host.querySelector('select');
      sel.value = lang;
      sel.addEventListener('change', () => set(sel.value));
      pickers.push(sel);
    });
  }

  window.PP_I18N = {
    LANGS, READY,
    get lang() { return lang; },
    add(code, data) { dicts[code] = Object.assign(dicts[code] || {}, data); },
    t, apply, set,
    onChange(fn) { listeners.push(fn); },
    // Numbers in the chosen language's digits (Bengali uses its own)
    num(n) { return lang === 'bn' ? String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]) : String(n); },
    ready: null
  };

  const start = async () => {
    buildPickers();
    await load('en');
    if (lang !== 'en') await load(lang);
    apply();
    listeners.forEach(fn => { try { fn(lang); } catch (e) { /* ignore */ } });
  };
  window.PP_I18N.ready = new Promise(res => {
    const go = () => start().then(res, res);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go, { once: true });
    else go();
  });
})();
