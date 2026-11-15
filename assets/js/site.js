/* ============ Pienipeli: website pages ============
   Small bits of play and help for the website pages. Each part only runs when its
   elements are on the page, so one file serves home, all games, parents and about.
   - Home: poppable hero balloons + pop counter, wobbly headline letters, and an animal
     playground that reuses Find the Animal's drawings and sounds.
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
    if (muted && window.FTA_Narrator) window.FTA_Narrator.stop();
    else if (muted && 'speechSynthesis' in window) speechSynthesis.cancel();
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

  // Say the animal's name in Find the Animal's gentle narrator voice
  const Narrator = window.FTA_Narrator || null;
  const STR = window.FTA_STRINGS ? window.FTA_STRINGS.T.en : null;
  function say(a) {
    if (muted || !Narrator || !STR) return;
    Narrator.say('en', [{ key: 'thatis-' + a.id, text: STR.thatIs(a.names.en), mood: 'soft' }]);
  }

  // ---------- Wobbly headline letters ----------
  document.querySelectorAll('.wobble').forEach(el => {
    el.setAttribute('aria-label', el.textContent);
    const wrap = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach(ch => {
            if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'ltr';
            s.setAttribute('aria-hidden', 'true');
            s.textContent = ch;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          n.setAttribute('aria-hidden', 'true');
          wrap(n);
        }
      });
    };
    wrap(el);
  });
  document.querySelectorAll('.ltr').forEach(s => {
    const boing = () => { s.classList.remove('boing'); void s.offsetWidth; s.classList.add('boing'); };
    s.addEventListener('pointerenter', boing);
    s.addEventListener('pointerdown', () => { boing(); play('tap'); });
    s.addEventListener('animationend', () => s.classList.remove('boing'));
  });

  // ---------- Hero: poppable balloons ----------
  const hero = $('hero');
  const layer = $('heroBalloons');
  const counter = $('popCount');
  let pops = 0;
  const MILESTONES = { 5: 'Yay!', 10: 'Wow!', 25: 'Super!', 50: 'Pop star!', 100: 'Amazing!' };
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
    counter.querySelector('b').textContent = pops;
    counter.classList.remove('bump');
    void counter.offsetWidth;
    counter.classList.add('bump');
    const msg = MILESTONES[pops] || (rainbow ? 'Rainbow!' : '');
    if (msg) {
      counter.querySelector('.pop-label').textContent = msg;
      if (MILESTONES[pops]) play('fanfare');
      clearTimeout(countPop.t);
      countPop.t = setTimeout(() => { counter.querySelector('.pop-label').textContent = 'popped!'; }, 1800);
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
  const zoo = $('zoo');
  const animals = window.FTA_ANIMALS, toSVG = window.FTA_toSVG;
  if (zoo && animals && toSVG) {
    $('play').hidden = false;
    const count = () => (innerWidth < 980 ? 4 : 8);
    function fill() {
      const pool = [...animals].sort(() => Math.random() - 0.5).slice(0, count());
      zoo.innerHTML = '';
      pool.forEach((a, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'critter';
        b.style.setProperty('--i', i);
        b.style.setProperty('--hue', (i * 47 + 20) % 360);
        b.setAttribute('aria-label', a.names.en);
        b.innerHTML = `<span class="critter-art">${toSVG(a)}</span><span class="critter-name" aria-hidden="true">${a.names.en}!</span>`;
        b.addEventListener('click', () => {
          b.classList.remove('boing', 'talk');
          void b.offsetWidth;
          b.classList.add('boing', 'talk');
          clearTimeout(b._t);
          b._t = setTimeout(() => b.classList.remove('talk'), 1600);
          const r = b.getBoundingClientRect(), zr = zoo.getBoundingClientRect();
          burst(r.left - zr.left + r.width / 2, r.top - zr.top + r.height * 0.3, ['💛', '✨', '⭐', '💖'], 7, zoo);
          play('animal', a.sound);
          clearTimeout(fill.sayT);
          fill.sayT = setTimeout(() => say(a), 650);
        });
        b.addEventListener('animationend', e => { if (e.animationName === 'boing') b.classList.remove('boing'); });
        zoo.appendChild(b);
      });
    }
    fill();
    $('zooShuffle').addEventListener('click', () => {
      play('success');
      zoo.classList.add('shuffling');
      setTimeout(() => { fill(); zoo.classList.remove('shuffling'); }, reduced ? 0 : 220);
    });
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
