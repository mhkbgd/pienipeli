/* ============ Color Splash! game logic ============
   A white picture (balloons, fish, flower, ...) and six paint pots.
   Tap a pot to pick its colour (every colour sings its own note), then tap a part of
   the picture: splat! it fills with colour, paint drops fly, and its note plays,
   so colouring in makes music. Babies can just tap the picture: the chosen colour
   moves on to the next one by itself after each splat until a pot is picked.
   All parts coloured: the picture dances, a little tune plays (made from the colours
   used), confetti, and the next picture appears. No words, no scores, no losing.     */

(function () {
  'use strict';

  const { Sound, fx, rand, pick, bag, later, centerOf, reduceMotion, hz } = window.Kit;

  // Colour, its musical note (C major pentatonic, so any order sounds nice), and a label
  const PAINTS = [
    { id: 'red',    fill: '#ff5a5f', note: 'C5', label: 'Red' },
    { id: 'orange', fill: '#ffa53a', note: 'D5', label: 'Orange' },
    { id: 'yellow', fill: '#ffd93d', note: 'E5', label: 'Yellow' },
    { id: 'green',  fill: '#5fd068', note: 'G5', label: 'Green' },
    { id: 'blue',   fill: '#4fb3ff', note: 'A5', label: 'Blue' },
    { id: 'purple', fill: '#b47cff', note: 'C6', label: 'Purple' }
  ];
  const nextPicture = bag(window.COLOR_PICTURES);

  const $ = (id) => document.getElementById(id);
  const canvas = $('picture');
  const pots = $('pots');

  let paint = PAINTS[0];
  let chosenByHand = false;   // once a pot is tapped, the colour stays until another pot is tapped
  let busy = true;
  let used = [];              // notes played this picture (for the finale tune)
  let hintTimer = 0;

  /* ---------- Paint pots ---------- */
  PAINTS.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pot';
    b.dataset.id = p.id;
    b.style.setProperty('--paint', p.fill);
    b.setAttribute('aria-label', p.label);
    b.innerHTML = '<span class="pot-paint" aria-hidden="true"></span><span class="pot-shine" aria-hidden="true"></span>';
    pots.appendChild(b);
  });

  function select(p, byHand) {
    paint = p;
    if (byHand) chosenByHand = true;
    pots.querySelectorAll('.pot').forEach((b) => {
      const on = b.dataset.id === p.id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    document.documentElement.style.setProperty('--brush', p.fill);
  }

  function onPot(btn) {
    if (!btn) return;
    const p = PAINTS.find((x) => x.id === btn.dataset.id);
    select(p, true);
    btn.classList.remove('bloop');
    void btn.offsetWidth;
    btn.classList.add('bloop');
    potSound(p);
    const c = centerOf(btn);
    fx.burst(c.x, c.y - c.h * 0.2, [p.fill], 6, 50);
    scheduleHint();
  }

  pots.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    onPot(e.target.closest('.pot'));
  });
  pots.addEventListener('click', (e) => { if (e.detail === 0) onPot(e.target.closest('.pot')); });

  /* ---------- Sounds made for this game ---------- */
  function potSound(p) {
    Sound.run(() => {
      // "bloop" of a brush dipping into paint, then the colour's note
      Sound.tone({ type: 'sine', f: [[0, 260], [0.1, 520]], dur: 0.12, vol: 0.18, attack: 0.005 });
      Sound.musicBox(hz(p.note), 0.08, 0.2, 1);
    });
  }
  function splatSound(p) {
    Sound.run(() => {
      Sound.noise({ dur: 0.18, vol: 0.2, attack: 0.005, filter: { type: 'lowpass', f: 1400 }, to: 300 });
      Sound.tone({ type: 'sine', f: [[0, 340], [0.08, 140]], dur: 0.1, vol: 0.22, attack: 0.003 });
      Sound.marimba(hz(p.note), 0.05, 0.26, 0.9);
      Sound.musicBox(hz(p.note) * 2, 0.05, 0.06, 0.6);
    });
  }
  function finaleTune(notes) {
    Sound.run(() => {
      // Replay the notes the child painted with, then a happy cadence
      const tune = notes.slice(-6).map((n) => [n, 0.5]);
      const t = Sound.melody(tune, { bpm: 220, voice: Sound.marimba });
      Sound.melody([['G5', 0.5], ['E5', 0.5], ['C6', 2]], { bpm: 220, voice: Sound.musicBox, at: t + 0.1 });
      [1568, 1976, 2349, 2637, 3136].forEach((fr, i) =>
        Sound.tone({ type: 'sine', f: [[0, fr]], at: t + 0.6 + i * 0.07, dur: 0.3, vol: 0.06, attack: 0.005, release: 0.25 }));
    });
  }

  /* ---------- Pictures ---------- */
  function newPicture() {
    busy = true;
    clearHint();
    used = [];
    const p = nextPicture();
    canvas.innerHTML = `<svg class="art" data-id="${p.id}" viewBox="0 0 400 400" role="img" aria-label="A picture to colour">${p.svg}</svg>`;
    canvas.className = 'picture enter';
    Sound.slideUp(0.3);
    later(() => { canvas.classList.remove('enter'); busy = false; scheduleHint(); }, reduceMotion ? 200 : 650);
  }

  function colour(region, e) {
    const p = paint;
    const same = region.dataset.paint === p.id;
    region.dataset.paint = p.id;
    region.style.fill = p.fill;
    region.classList.remove('splat');
    void region.getBoundingClientRect();
    region.classList.add('splat');
    splatSound(p);
    used.push(p.note);
    fx.burst(e.clientX, e.clientY, [p.fill, p.fill, '#ffffff'], same ? 6 : 12, 90);
    if (same) fx.rise(e.clientX, e.clientY, '✨', { size: 36 });

    // Babies who only tap the picture still get every colour
    if (!chosenByHand) {
      const i = PAINTS.indexOf(p);
      select(PAINTS[(i + 1) % PAINTS.length], false);
    }

    const left = canvas.querySelectorAll('.region:not([data-paint])').length;
    if (!left) done();
    else scheduleHint();
  }

  function done() {
    busy = true;
    clearHint();
    later(() => {
      canvas.classList.add('alive');
      finaleTune(used);
      const r = canvas.getBoundingClientRect();
      // Confetti in the colours the child used
      const colours = [...new Set([...canvas.querySelectorAll('.region')].map((x) => x.style.fill))];
      fx.confetti(r.left + r.width / 2, r.top + r.height * 0.4, 50, colours);
      fx.floaties(r, reduceMotion ? 6 : 14);
    }, 450);
    later(() => { canvas.classList.remove('alive'); canvas.classList.add('leave'); }, 3600);
    later(newPicture, 4100);
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    if (busy) return;
    const region = e.target.closest('.region');
    if (region) colour(region, e);
    else {
      // Tapped the background: a little wobble so nothing feels broken
      const art = canvas.querySelector('.art');
      if (art && !art.classList.contains('wobble')) {
        art.classList.add('wobble');
        art.addEventListener('animationend', () => art.classList.remove('wobble'), { once: true });
        Sound.tap();
      }
    }
  });

  // Keyboard: any key colours the next white part with the next colour
  document.addEventListener('keydown', (e) => {
    if (busy || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') return;
    const white = [...canvas.querySelectorAll('.region:not([data-paint])')];
    const region = white.length ? pick(white) : null;
    if (!region) return;
    const c = centerOf(region);
    colour(region, { clientX: c.x, clientY: c.y });
  });

  /* ---------- Gentle hint: a white part glows ---------- */
  function hint() {
    if (busy) return;
    const white = [...canvas.querySelectorAll('.region:not([data-paint])')];
    if (!white.length) return;
    const r = pick(white);
    r.classList.remove('glow');
    void r.getBoundingClientRect();
    r.classList.add('glow');
    Sound.twinkle();
    r.addEventListener('animationend', () => r.classList.remove('glow'), { once: true });
  }
  function scheduleHint() {
    clearHint();
    hintTimer = setTimeout(() => { hint(); scheduleHint(); }, 6500);
  }
  function clearHint() { clearTimeout(hintTimer); }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearHint();
    else if (!busy) scheduleHint();
  });

  Kit.setup({ id: 'color-splash', how: () => {
    const pot = document.querySelector('.pot:nth-child(5)');
    const r = canvas.querySelector('.region:not([data-paint])');
    return [{ tap: pot }, { tap: r }];
  } });
  select(PAINTS[0], false);
  newPicture();
})();
