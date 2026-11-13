/* ============ Pienipeli: landing page ============
   Little bits of play for the landing page:
   - poppable hero balloons with a pop counter (tap the sky for more)
   - wobbly headline letters, a sun that follows the pointer
   - an animal playground that reuses Find the Animal's drawings and sounds
   - scroll reveals, count-up stats and tilting game cards
   Every sound is generated live (games/find-the-animal/sounds.js); nothing is fetched. */

(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  root.classList.add('js');

  const yearEl = $('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pienipeli-' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('pienipeli-' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  // ---------- Sound (optional: everything works silently without it) ----------
  const Sound = window.FTA_Sound || null;
  let muted = store.get('muted', false);
  const toggle = $('soundToggle');
  function applyMute() {
    if (Sound) Sound.setMuted(muted);
    if (muted && 'speechSynthesis' in window) speechSynthesis.cancel();
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

  function say(text) {
    if (muted || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US'; u.rate = 0.9; u.pitch = 1.15;
      speechSynthesis.speak(u);
    } catch (e) { /* no voice: that's fine */ }
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
  document.querySelectorAll('.ltr').forEach((s, i) => {
    const boing = () => {
      s.classList.remove('boing');
      void s.offsetWidth; // restart the animation
      s.classList.add('boing');
    };
    s.addEventListener('pointerenter', boing);
    s.addEventListener('pointerdown', () => { boing(); play('tap'); });
    s.addEventListener('animationend', () => s.classList.remove('boing'));
    s.style.setProperty('--i', i);
  });

  // ---------- Hero: sun follows the pointer ----------
  const hero = $('hero');
  if (hero && finePointer && !reduced) {
    let raf = 0;
    hero.addEventListener('pointermove', e => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = hero.getBoundingClientRect();
        hero.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        hero.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    });
    hero.addEventListener('pointerleave', () => { hero.style.setProperty('--px', 0); hero.style.setProperty('--py', 0); });
  }

  // ---------- Hero: poppable balloons ----------
  const layer = $('heroBalloons');
  const counter = $('popCount');
  let pops = 0;
  const MILESTONES = { 5: 'Yay!', 10: 'Wow!', 25: 'Super!', 50: 'Pop star!', 100: 'Amazing!' };

  const PALETTES = [
    ['#ffe3ef', '#ffa6cb', '#f77fb0'],
    ['#e0f2ff', '#8ecbff', '#62aef0'],
    ['#fffbd0', '#ffe27a', '#f5c94a'],
    ['#efe4ff', '#c6a8ff', '#a583f0'],
    ['#dcfbec', '#9fe8c3', '#6fd3a2'],
  ];
  const BITS = ['⭐', '✨', '💖', '💛', '💫'];
  const maxBalloons = () => (innerWidth < 600 ? 5 : 9);

  function spawn(midFlight, atX) {
    if (!layer || layer.childElementCount > maxBalloons() + 6) return;
    const h = layer.clientHeight;
    const size = Math.round(rand(56, 86));
    const dur = rand(13, 21);
    const rainbow = Math.random() < 0.08;
    const [c1, c2, c3] = pick(PALETTES);

    const el = document.createElement('div');
    el.className = 'hb' + (rainbow ? ' rainbow' : '');
    el.style.cssText =
      `--size:${size}px;--c1:${c1};--c2:${c2};--c3:${c3};--h:${h}px;` +
      `--dur:${dur}s;--delay:${midFlight ? -rand(0, dur * 0.85) : 0}s;--sd:${-rand(0, 4)}s;`;
    // Keep balloons mostly to the right on wide screens so the headline stays readable
    const minX = innerWidth > 900 ? 0.52 : 0.05;
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
    el.querySelector('.balloon').addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      pop(el);
    });
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
    // Tap the empty sky: a little sparkle and a new balloon right there
    hero.addEventListener('pointerdown', e => {
      if (e.target.closest('a, button, .balloon, .ltr')) return;
      const box = layer.getBoundingClientRect();
      burst(e.clientX - box.left, e.clientY - box.top, ['✨', '⭐'], 5);
      spawn(false, e.clientX - box.left);
      play('tap');
    });
  } else if (counter) {
    const hint = document.querySelector('.hint');
    if (hint) hint.hidden = true;
  }

  // ---------- Animal playground ----------
  const zoo = $('zoo');
  const animals = window.FTA_ANIMALS, toSVG = window.FTA_toSVG;
  if (zoo && animals && toSVG) {
    $('play').hidden = false;
    const count = () => (innerWidth < 600 ? 6 : 8);

    function fill() {
      const pool = [...animals].sort(() => Math.random() - 0.5).slice(0, count());
      zoo.innerHTML = '';
      pool.forEach((a, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'critter';
        b.style.setProperty('--i', i);
        b.style.setProperty('--hue', (i * 47) % 360);
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
          fill.sayT = setTimeout(() => say(a.names.en), 650);
        });
        b.addEventListener('animationend', e => { if (e.animationName === 'boing') b.classList.remove('boing'); });
        zoo.appendChild(b);
      });
    }
    fill();
    $('zooShuffle').addEventListener('click', () => { play('success'); zoo.classList.add('shuffling'); setTimeout(() => { fill(); zoo.classList.remove('shuffling'); }, reduced ? 0 : 220); });
  }

  // ---------- Count-up stats ----------
  function countUp(el) {
    const to = +el.dataset.count, suffix = el.dataset.suffix || '';
    if (reduced || to === 0) { el.textContent = to + suffix; return; }
    const t0 = performance.now(), dur = 1100;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = '0' + suffix;
    requestAnimationFrame(step);
  }

  // ---------- Scroll reveals ----------
  const revealables = document.querySelectorAll('.reveal, [data-count]');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        if (en.target.dataset.count !== undefined) countUp(en.target);
        else en.target.classList.add('in');
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealables.forEach(el => io.observe(el));
  } else {
    revealables.forEach(el => el.classList.add('in'));
  }

  // ---------- Tilting game cards ----------
  if (finePointer && !reduced) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
        card.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
        card.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(1) + '%');
        card.classList.add('tilting');
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('tilting');
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // ---------- Header: subtle shadow once you scroll ----------
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
