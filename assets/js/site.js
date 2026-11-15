/* ============ Pienipeli: website pages ============
   Small bits of play and help for the website pages. Each part only runs when its
   elements are on the page, so one file serves home, all games, parents and about.
   - Home: poppable hero balloons + pop counter, wobbly headline letters, and an animal
     playground that reuses Find the Animal's drawings and sounds (loaded only when it
     scrolls into view; names shown in the chosen language, never spoken).
   - All games: filter chips (also from the address: games/#age-1, #music, ...).
   - Parents: device tabs for the home-screen guide (opens on the visitor's device).
   - Everywhere: "Surprise me" buttons, scroll reveals, header line on scroll.
   Every sound is generated live (games/find-the-animal/sounds.js); nothing is fetched. */

(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');

  const yearEl = $('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pienipeli-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('pienipeli-' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  // ---------- Counts in the chosen language's digits (Bengali has its own) ----------
  if (window.PP_I18N) PP_I18N.onChange(() => document.querySelectorAll('.n').forEach(el => {
    if (!el.dataset.n) el.dataset.n = el.textContent;
    el.textContent = PP_I18N.num(el.dataset.n);
  }));

  // ---------- Old single-page links (pienipeli.fi/#faq etc.) go to their new pages ----------
  const OLD = { '#games': 'games/index.html', '#parents': 'parents.html', '#faq': 'parents.html#faq', '#about': 'about.html' };
  if ($('hero') && OLD[location.hash]) location.replace(OLD[location.hash]);

  // ---------- Header: a line under it once you scroll ----------
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- "Surprise me": a random game ----------
  document.querySelectorAll('[data-random]').forEach(a => {
    a.addEventListener('click', e => {
      const list = a.dataset.random.split(' ').filter(Boolean);
      if (!list.length) return;
      e.preventDefault();
      a.classList.add('rolling');
      setTimeout(() => { location.href = pick(list); }, reduced ? 0 : 250);
    });
  });

  // ---------- Sound (home only; everything works silently without it) ----------
  const Sound = window.FTA_Sound || null;
  let muted = store.get('muted', false);
  const toggle = $('soundToggle');
  function applyMute() {
    if (Sound) Sound.setMuted(muted);
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(!muted));
      toggle.setAttribute('aria-label', muted ? 'Sound off' : 'Sound on');
    }
  }
  if (Sound && toggle) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      muted = !muted;
      store.set('muted', muted);
      applyMute();
      if (!muted) { Sound.unlock(); Sound.tap(); }
    });
  }
  applyMute();
  const play = (fn, ...args) => { if (Sound && !muted) { Sound.unlock(); Sound[fn](...args); } };

  const I18N = window.PP_I18N;
  const tr = (key, fallback) => (I18N ? I18N.t(key, fallback) : fallback);

  // ---------- Wobbly headline letters ----------
  // The hero heading is split into letters that boing when touched (and get rainbow
  // colours). Translations replace the heading, so it is split again after every
  // language change. Bengali is split into whole words: splitting its letters would
  // break the joined letters (conjuncts).
  const segmenter = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const pieces = (text) => {
    if (document.documentElement.lang === 'bn') return text.split(/(\s+)/).filter(Boolean);
    return segmenter ? [...segmenter.segment(text)].map(x => x.segment) : [...text];
  };
  function wobble(el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const wrap = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          pieces(n.textContent).forEach(ch => {
            if (/^\s+$/.test(ch)) { frag.appendChild(document.createTextNode(' ')); return; }
            const sp = document.createElement('span');
            sp.className = 'ltr';
            sp.setAttribute('aria-hidden', 'true');
            sp.textContent = ch;
            frag.appendChild(sp);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('ltr')) {
          n.setAttribute('aria-hidden', 'true');
          wrap(n);
        }
      });
    };
    wrap(el);
    el.querySelectorAll('.ltr').forEach(sp => {
      const boing = () => { sp.classList.remove('boing'); void sp.offsetWidth; sp.classList.add('boing'); };
      sp.addEventListener('pointerenter', boing);
      sp.addEventListener('pointerdown', () => { boing(); play('tap'); });
      sp.addEventListener('animationend', () => sp.classList.remove('boing'));
    });
  }
  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) {
    const raw = heroTitle.innerHTML;          // the clean English heading
    wobble(heroTitle);
    if (I18N) I18N.onChange((lang) => { if (lang === 'en') heroTitle.innerHTML = raw; wobble(heroTitle); });
  }

  // ---------- Hero: poppable balloons ----------
  const hero = $('hero');
  const layer = $('heroBalloons');
  const counter = $('popCount');
  let pops = 0;
  const MILESTONES = { 5: 'Yay!', 10: 'Wow!', 25: 'Super!', 50: 'Pop star!', 100: 'Amazing!' };
  const milestone = (n) => MILESTONES[n] ? tr('home.milestone.' + n, MILESTONES[n]) : '';
  const PALETTES = [
    ['#ffe3ef', '#ff9fc6', '#f77fb0'],
    ['#e0f2ff', '#8ecbff', '#5fb4f0'],
    ['#fff6c8', '#ffd84f', '#f5c23a'],
    ['#efe4ff', '#c6a8ff', '#a583f0'],
    ['#dcfbec', '#7fe3b8', '#48d6a4'],
    ['#ffe6dc', '#ff9a85', '#ff6f59'],
  ];
  const BITS = ['⭐', '✨', '💖', '💛', '💫'];
  const maxBalloons = () => (innerWidth < 760 ? 4 : 7);

  function spawn(midFlight, atX) {
    if (!layer || layer.childElementCount > maxBalloons() + 6) return;
    const h = layer.clientHeight;
    const size = Math.round(rand(50, 78));
    const dur = rand(13, 21);
    const rainbow = Math.random() < 0.08;
    const [c1, c2, c3] = pick(PALETTES);
    const el = document.createElement('div');
    el.className = 'hb' + (rainbow ? ' rainbow' : '');
    el.style.cssText =
      `--size:${size}px;--c1:${c1};--c2:${c2};--c3:${c3};--h:${h}px;` +
      `--dur:${dur}s;--delay:${midFlight ? -rand(0, dur * 0.85) : 0}s;--sd:${-rand(0, 4)}s;`;
    // Keep balloons off the headline on wide screens
    const minX = innerWidth > 980 ? 0.5 : innerWidth < 760 ? 0.62 : 0.04;
    const x = atX !== undefined
      ? Math.min(Math.max(atX - size / 2, 4), layer.clientWidth - size - 4)
      : rand(layer.clientWidth * minX, layer.clientWidth - size - 10);
    el.style.left = x + 'px';
    el.innerHTML = '<div class="sway"><div class="balloon"><i class="face"></i></div><span class="string"></span></div>';
    el.addEventListener('animationend', e => {
      if (e.animationName !== 'rise') return;
      el.remove();
      if (layer.childElementCount < maxBalloons()) spawn(false);
    });
    el.querySelector('.balloon').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); pop(el); });
    layer.appendChild(el);
  }

  function burst(x, y, bits, n = 9, host = layer) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      const a = (i / n) * Math.PI * 2 + rand(-0.2, 0.2);
      const d = rand(40, 90);
      s.className = 'spark';
      s.textContent = pick(bits);
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.setProperty('--dx', Math.cos(a) * d + 'px');
      s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      s.addEventListener('animationend', () => s.remove());
      host.appendChild(s);
    }
  }

  function pop(el) {
    if (el.classList.contains('popped')) return;
    const b = el.querySelector('.balloon').getBoundingClientRect();
    const box = layer.getBoundingClientRect();
    el.classList.add('popped');
    setTimeout(() => { el.remove(); setTimeout(() => { if (layer.childElementCount < maxBalloons()) spawn(false); }, 900); }, 300);
    const rainbow = el.classList.contains('rainbow');
    burst(b.left - box.left + b.width / 2, b.top - box.top + b.height / 2, rainbow ? ['🌈', '⭐', '💖', '✨'] : BITS, rainbow ? 14 : 9);
    play(rainbow ? 'success' : 'tap');
    countPop(rainbow);
  }

  function countPop(rainbow) {
    if (!counter) return;
    pops++;
    counter.hidden = false;
    counter.querySelector('b').textContent = I18N ? I18N.num(pops) : pops;
    counter.classList.remove('bump');
    void counter.offsetWidth;
    counter.classList.add('bump');
    const msg = milestone(pops) || (rainbow ? tr('home.rainbow', 'Rainbow!') : '');
    if (msg) {
      counter.querySelector('.pop-label').textContent = msg;
      if (MILESTONES[pops]) play('fanfare');
      clearTimeout(countPop.t);
      countPop.t = setTimeout(() => { counter.querySelector('.pop-label').textContent = tr('home.popped', 'popped!'); }, 1800);
    }
    const hint = document.querySelector('.hint');
    if (hint) hint.classList.add('gone');
  }

  if (layer && hero && !reduced) {
    for (let i = 0; i < maxBalloons() - 2; i++) spawn(true);
    // Tap empty sky: a sparkle and a new balloon right there
    hero.addEventListener('pointerdown', e => {
      if (e.target.closest('a, button, .balloon, .ltr')) return;
      const box = layer.getBoundingClientRect();
      burst(e.clientX - box.left, e.clientY - box.top, ['✨', '⭐'], 5);
      spawn(false, e.clientX - box.left);
      play('tap');
    });
  } else {
    const hint = document.querySelector('.hint');
    if (hint) hint.hidden = true;
  }

  // ---------- Animal playground (home) ----------
  // The 40 drawings (games/find-the-animal/animals.js) load only when the playground
  // is about to scroll into view, so the home page opens fast on phones.
  const zoo = $('zoo');
  const playSection = $('play');
  if (zoo && playSection) {
    const here = document.currentScript && document.currentScript.src;
    const animalsSrc = new URL('../../games/find-the-animal/animals.js', here || location.href).href;
    let loaded = false, fill = null;
    const nameOf = (a) => (a.names[I18N && I18N.lang] || a.names.en);
    function setup() {
      const animals = window.FTA_ANIMALS, toSVG = window.FTA_toSVG;
      if (!animals || !toSVG) return;
      const count = () => (innerWidth < 980 ? 4 : 8);
      fill = () => {
        const pool = [...animals].sort(() => Math.random() - 0.5).slice(0, count());
        zoo.innerHTML = '';
        pool.forEach((a, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'critter';
          b._animal = a;
          b.style.setProperty('--i', i);
          b.style.setProperty('--hue', (i * 47 + 20) % 360);
          b.setAttribute('aria-label', nameOf(a));
          b.innerHTML = `<span class="critter-art">${toSVG(a)}</span><span class="critter-name" aria-hidden="true">${nameOf(a)}!</span>`;
          b.addEventListener('click', () => {
            b.classList.remove('boing', 'talk');
            void b.offsetWidth;
            b.classList.add('boing', 'talk');
            clearTimeout(b._t);
            b._t = setTimeout(() => b.classList.remove('talk'), 1600);
            const r = b.getBoundingClientRect(), zr = zoo.getBoundingClientRect();
            burst(r.left - zr.left + r.width / 2, r.top - zr.top + r.height * 0.3, ['💛', '✨', '⭐', '💖'], 7, zoo);
            play('animal', a.sound);
          });
          b.addEventListener('animationend', e => { if (e.animationName === 'boing') b.classList.remove('boing'); });
          zoo.appendChild(b);
        });
      };
      fill();
      $('zooShuffle').addEventListener('click', () => {
        play('success');
        zoo.classList.add('shuffling');
        setTimeout(() => { fill(); zoo.classList.remove('shuffling'); }, reduced ? 0 : 220);
      });
      // Names follow the language picker
      if (I18N) I18N.onChange(() => zoo.querySelectorAll('.critter').forEach(b => {
        b.setAttribute('aria-label', nameOf(b._animal));
        b.querySelector('.critter-name').textContent = nameOf(b._animal) + '!';
      }));
    }
    function load() {
      if (loaded) return;
      loaded = true;
      const sc = document.createElement('script');
      sc.src = animalsSrc;
      sc.onload = setup;
      sc.onerror = () => { playSection.hidden = true; };   // no drawings: just hide the playground
      document.head.appendChild(sc);
    }
    playSection.hidden = false;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: '600px 0px' });
      io.observe(playSection);
    } else load();
  }

  // ---------- All games: filters ----------
  const filters = $('filters');
  const grid = $('gameGrid');
  if (filters && grid) {
    filters.hidden = false;
    const chips = [...filters.querySelectorAll('.chip')];
    const cards = [...grid.querySelectorAll('.game-card')];
    const empty = $('empty');
    function apply(f, push) {
      if (!chips.some(c => c.dataset.filter === f)) f = 'all';
      chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
      let shown = 0;
      cards.forEach(card => {
        const on = f === 'all' || card.dataset.tags.split(' ').includes(f);
        card.classList.toggle('out', !on);
        if (on) { shown++; card.classList.add('in'); }
      });
      if (empty) empty.classList.toggle('show', shown === 0);
      if (push) history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f);
    }
    chips.forEach(c => c.addEventListener('click', () => apply(c.dataset.filter, true)));
    apply(location.hash.slice(1) || 'all', false);
    addEventListener('hashchange', () => apply(location.hash.slice(1) || 'all', false));
  }

  // ---------- Parents: device tabs ----------
  const tabs = $('setupTabs');
  if (tabs) {
    const btns = [...tabs.querySelectorAll('[role="tab"]')];
    const select = (btn, focus) => {
      btns.forEach(b => {
        const on = b === btn;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        $(b.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) btn.focus();
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => select(b));
      b.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); select(btns[(i + d + btns.length) % btns.length], true); }
      });
    });
    // Open the visitor's own device first
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    select(ios ? btns[0] : /Android/.test(ua) ? btns[1] : (matchMedia('(pointer: fine)').matches ? btns[2] : btns[0]));
  }

  // ---------- Scroll reveals ----------
  const revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        en.target.classList.add('in');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealables.forEach(el => io.observe(el));
  } else {
    revealables.forEach(el => el.classList.add('in'));
  }
})();
